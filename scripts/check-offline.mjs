import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium, expect } from "@playwright/test";
import { fixtureStaff, login, origin } from "./check-collections.mjs";

const [a, b] = await fixtureStaff();
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
const reference = randomUUID();
try {
  let page = await login(browser, a);
  const context = page.context();
  const ready = () =>
    page.getByText("Ready for offline use", { exact: false }).first().waitFor();
  const open = () => page.goto(origin + "/offline");
  async function signin(user, waitForReady = true) {
    await page.goto(origin + "/login");
    await page.getByLabel("Email address").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.waitForURL("**/dashboard");
    if (waitForReady) await ready();
  }
  await ready();
  const leaseCookie = (await context.cookies()).find(
    (c) => c.name === "calvary-offline",
  );
  const until = Number(leaseCookie.value.split(".")[2]);
  assert.ok(until - Date.now() <= 86401000 && until - Date.now() > 86300000);

  await context.setOffline(true);
  await open();
  for (let n = 0; n < 10; n++) {
    await page.getByRole("button", { name: "Record contribution" }).click();
    await page.getByLabel("Contributor type").selectOption("guest");
    await page.getByLabel("Guest name").fill("Offline fixture " + n);
    await page
      .getByLabel("Category 1")
      .selectOption({ label: "Budget Support" });
    await page.getByLabel("Amount 1", { exact: true }).fill("1.25");
    await page.getByLabel("Reference (optional)").fill(reference);
    if (n === 0) {
      await expect(page.getByText(/Unfinished draft/)).toContainText(
        "Offline fixture 0",
      );
      await page.reload();
      await page.getByRole("button", { name: "Open entry" }).click();
      await expect(page.getByLabel("Amount 1", { exact: true })).toHaveValue(
        "1.25",
      );
      await expect(page.getByLabel("Reference (optional)")).toHaveValue(
        reference,
      );
    }
    await page.getByRole("button", { name: "Review contribution" }).click();
    await page.getByRole("button", { name: "Post contribution" }).click();
    await expect(page.getByText(/Waiting to sync/)).toHaveCount(n + 1);
  }
  await expect(page.getByText("Awaiting posting · USD 12.50")).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify(localStorage));
  assert.ok(!stored.includes(reference) && !stored.includes("Offline fixture"));
  assert.ok(
    await page.evaluate(async () => {
      const cache = await caches.open(
        (await caches.keys()).find((k) => k.startsWith("calvary-shell-")),
      );
      return (await cache.keys()).every((r) =>
        /^\/(offline$|_next\/static\/)/.test(new URL(r.url).pathname),
      );
    }),
  );
  await page.close();
  page = await context.newPage();
  await open();
  await expect(page.getByText(/Waiting to sync/)).toHaveCount(10);
  await page.clock.setFixedTime(new Date(until + 1000));
  await expect(page.getByText(/Offline entry is locked/)).toBeVisible();
  await expect(page.getByText(/Offline fixture/)).toHaveCount(0);
  await page.clock.setFixedTime(new Date());
  await page.close();
  page = await context.newPage();
  await context.setOffline(false);
  await signin(b);
  await open();
  await expect(page.getByText("No saved collections.")).toBeVisible();
  await expect(page.getByText(/Offline fixture/)).toHaveCount(0);

  // First request commits to PostgreSQL, but the browser loses its reply.
  let replay;
  await context.route("**/api/offline?op=post", async (route) => {
    if (!replay) {
      replay = route.request().postDataJSON();
      const committed = await route.fetch();
      assert.equal(committed.status(), 200);
      await route.abort("connectionreset");
    } else await route.continue();
  });
  await signin(a, false);
  await expect
    .poll(
      async () => {
        const { data, error } = await a.db
          .from("collections")
          .select("receipt,total")
          .eq("reference", reference);
        assert.ifError(error);
        return [
          data.length,
          new Set(data.map((row) => row.receipt)).size,
          data.reduce((sum, r) => sum + r.total, 0),
        ];
      },
      { timeout: 90000 },
    )
    .toEqual([10, 10, 1250]);
  await open();
  await expect(page.getByText("No saved collections.")).toBeVisible({
    timeout: 90000,
  });
  assert.ok(replay);
  await signin(b);
  const refused = await page.request.post(origin + "/api/offline?op=post", {
    data: replay,
    headers: { "x-calvary-offline": "1" },
  });
  assert.equal(refused.status(), 403);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("**/login");
  await context.setOffline(true);
  await open();
  await expect(page.getByText(/Offline entry is locked/)).toBeVisible();
  console.log(
    "PASS: offline drafts, ten receipts, lost confirmation, lease expiry, encrypted records, account isolation and sign-out",
  );
} finally {
  await browser.close();
}
