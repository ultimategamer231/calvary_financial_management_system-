// Read-only against the seeded local stack. A period with ledger activity is required.
import assert from "node:assert/strict";
import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { decimal, money } from "../lib/money.ts";
import { fixtureStaff, login, origin } from "./check-collections.mjs";

const staff = await fixtureStaff();
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
const allDates = { from: "", to: "" };

async function verifyPeriod(page, db, filters) {
  const { data, error } = await db.rpc("finance_report", { filters });
  assert.ifError(error);
  await page.goto(origin + "/dashboard?" + new URLSearchParams(filters));
  await page.getByRole("heading", { name: "Recent entries" }).waitFor();
  for (const [currency, name] of [["USD", "US dollar"], ["LRD", "Liberian dollar"]]) {
    const total = data.totals.find((row) => row.currency === currency);
    const income = BigInt(total?.income ?? 0);
    const expense = BigInt(total?.expense ?? 0);
    const ledger = page.getByRole("region", { name, exact: true });
    assert.deepEqual(await ledger.locator("dd").allTextContents(), [
      money(currency, income - expense), money(currency, income), money(currency, expense),
    ]);
    const groups = data.groups.filter((row) => row.currency === currency);
    const groupRows = page.getByRole("table", { name: name + " categories" }).locator("tbody tr");
    assert.equal(await groupRows.count(), groups.length);
    for (const [i, g] of groups.entries()) {
      assert.deepEqual(await groupRows.nth(i).locator("td").allTextContents(),
        [g.category, g.kind, money(currency, g.amount)]);
    }
  }
  const rows = page.getByRole("region", { name: "Recent entries table" }).locator("tbody tr");
  const recent = data.rows.slice(0, 8);
  assert.equal(await rows.count(), recent.length);
  for (const [index, item] of recent.entries()) {
    const row = rows.nth(index);
    assert.deepEqual(await row.locator("td").allTextContents(), [
      item.reference + item.kind, money(item.currency, item.amount), item.business_date,
      item.party, item.category, item.method,
    ]);
    assert.equal(await row.getByRole("link").getAttribute("href"),
      (item.kind === "Income" ? "/receipts/" : "/expenses/") + item.record_id);
  }
  return data;
}

async function checkRegisterControls(page, data) {
  const table = page.getByRole("table", { name: "Recent entries table" });
  const recent = data.rows.slice(0, 8);
  if (recent.length > 1) {
    const header = table.getByRole("columnheader", { name: "Amount", exact: true });
    for (const direction of ["descending", "ascending"]) {
      await header.getByRole("button").click();
      await expect(header).toHaveAttribute("aria-sort", direction);
      const expected = [...recent].sort((a, b) => {
        if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
        const delta = BigInt(a.amount) - BigInt(b.amount);
        return (delta < 0n ? -1 : delta > 0n ? 1 : 0) * (direction === "ascending" ? 1 : -1);
      });
      assert.deepEqual(await table.locator("tbody tr td:nth-child(2)").allTextContents(),
        expected.map((row) => money(row.currency, row.amount)));
    }
    for (const ledger of ["US dollar", "Liberian dollar"]) {
      const categories = page.getByRole("table", { name: ledger + " categories" });
      if (await categories.locator("tbody tr").count() < 2) continue;
      const category = categories.getByRole("button", { name: "Category", exact: true });
      await category.focus();
      await page.keyboard.press("Enter");
      await expect(categories.locator("th").first()).toHaveAttribute("aria-sort", "ascending");
      await expect(header).toHaveAttribute("aria-sort", "ascending");
    }
  }
  const submit = page.getByRole("button", { name: "Update period" });
  await submit.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Apply these dates to both ledgers.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
}

try {
  for (const [index, user] of staff.entries()) {
    const page = await login(browser, user);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.name));
    const data = await verifyPeriod(page, user.db, allDates);
    assert.ok(data.rows.length, "Run against the fictional local reporting fixture.");
    if (index === 0) {
      for (const width of [1920, 1440, 1280, 1024, 768, 390, 360]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        for (const el of await page.locator("dd").all()) {
          assert.ok(await el.evaluate((node) => node.scrollWidth <= node.clientWidth + 1));
        }
      }
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        const scan = await new AxeBuilder({ page }).analyze();
        assert.deepEqual(scan.violations.map((v) => v.id), []);
      }
      await checkRegisterControls(page, data);
      const sample = data.rows[0];
      const filters = { from: sample.business_date, to: sample.business_date, currency: sample.currency };
      const filtered = await verifyPeriod(page, user.db, filters);
      await page.getByLabel("To", { exact: true }).fill("");
      await page.getByRole("button", { name: "Update period" }).click();
      await page.waitForURL((url) => url.searchParams.get("to") === "" && url.searchParams.get("currency") === sample.currency);
      await page.getByRole("link", { name: "Clear filters" }).waitFor();
      await page.getByLabel("From", { exact: true }).fill("");
      await page.getByLabel("To", { exact: true }).fill(sample.business_date);
      await page.getByRole("button", { name: "Update period" }).click();
      await page.waitForURL((url) => url.searchParams.get("from") === "" && url.searchParams.get("to") === sample.business_date);
      await page.getByRole("link", { name: "Clear filters" }).click();
      await page.waitForURL((url) => !url.searchParams.has("currency"));
      await page.goBack();
      await page.getByRole("link", { name: "Clear filters" }).waitFor();
      await page.getByLabel("From", { exact: true }).fill(sample.business_date);
      await page.getByRole("button", { name: "Update period" }).click();
      await page.waitForURL((url) => url.searchParams.get("from") === sample.business_date);
      await page.getByRole("link", { name: "View full report" }).click();
      await page.getByRole("heading", { name: "Financial reports" }).waitFor();
      assert.equal(new URL(page.url()).searchParams.get("from"), sample.business_date);
      const csv = await page.request.get(origin + "/reports/export?" + new URLSearchParams(filters));
      assert.equal(csv.status(), 200);
      assert.ok((await csv.text()).includes(decimal(filtered.rows[0].amount)));
      await page.goto(origin + "/dashboard?from=2099-04-02&to=2099-04-01");
      await page.getByRole("alert").getByText(/Choose a valid date range/).waitFor();
      assert.equal(await page.getByRole("heading", { name: "Period movement" }).count(), 0);
      await page.getByRole("link", { name: "Reset dashboard" }).click();
      await page.getByRole("heading", { name: "Period movement" }).waitFor();
      const empty = await verifyPeriod(page, user.db, { from: "0001-01-01", to: "0001-01-01" });
      assert.equal(empty.rows.length, 0);
      await page.getByText("No matching categories.").waitFor();
      await page.getByText(/No entries in this period/).waitFor();
    }
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/login");
    await page.goto(origin + "/dashboard");
    await page.waitForURL("**/login");
    assert.deepEqual(errors, []);
    await page.context().close();
  }
  console.log("PASS: both staff ledgers, signed-out redirect, report parity, date filters, states, seven widths and axe.");
} finally {
  await browser.close();
}
