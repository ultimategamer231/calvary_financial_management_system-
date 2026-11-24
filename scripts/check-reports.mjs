import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "@playwright/test";
import { fixtureStaff, login, inspect, origin } from "./check-collections.mjs";
const [a, b] = await fixtureStaff(),
  ok = (r) => {
    assert.ifError(r.error);
    return r.data;
  },
  db = a.db;
const row = ok(
  await db
    .from("categories")
    .select("id")
    .eq("name", "Budget Support")
    .single(),
);
const member = ok(
  await db
    .from("members")
    .insert({ name: "Pilot Statement Member" })
    .select("id")
    .single(),
);
const post = (total, currency, kind, other = {}) =>
  db.rpc("post_collection", {
    request_key_input: randomUUID(),
    entry: {
      kind,
      guest: "=Pilot Guest",
      member: member.id,
      date: "2030-02-03",
      currency,
      method: "Cash",
      total,
      lines: [{ category: row.id, amount: total }],
      ...other,
    },
  });
const one = ok(await post("10000", "USD", "member"));
const old = ok(await post("2000", "USD", "guest"));
ok(
  await post("2500", "USD", "guest", {
    replaces: old,
    reason: "Pilot amount correction",
  }),
);
ok(await post("50000", "LRD", "anonymous"));
for (const [currency, amount] of [
  ["USD", "4000"],
  ["LRD", "8000"],
])
  ok(
    await b.db.rpc("post_expense", {
      request_key_input: randomUUID(),
      entry: {
        date: "2030-02-04",
        currency,
        amount,
        payee: "Pilot Vendor",
        description: "Pilot expense",
        category: "Utilities",
        method: "Cash",
      },
    }),
  );
const filters = { from: "2030-02-01", to: "2030-02-28" };
const report = ok(await db.rpc("finance_report", { filters }));
assert.deepEqual(report.totals, [
  { currency: "LRD", income: "50000", expense: "8000" },
  { currency: "USD", income: "12500", expense: "4000" },
]);
assert.equal(report.rows.length, 5);
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
try {
  const page = await login(browser, b);
  const params = new URLSearchParams(filters);
  await page.goto(origin + "/reports?" + params);
  await page.getByText("USD 85.00", { exact: true }).waitFor();
  await page.getByText("LRD 420.00", { exact: true }).waitFor();
  await inspect(page, "reports");
  const csv = await page.request.get(origin + "/reports/export?" + params);
  assert.equal(csv.status(), 200);
  assert.ok((await csv.text()).includes("'=Pilot Guest"));
  await page.goto(origin + "/members/" + member.id + "/statement?" + params);
  await page
    .getByRole("heading", { name: "Pilot Statement Member", exact: true })
    .waitFor();
  await page.getByRole("link", { name: /CBC-/ }).first().waitFor();
  await page.goto(origin + "/settings");
  await page.getByLabel("Church name").fill("Pilot Church");
  await page.getByRole("button", { name: "Save church profile" }).click();
  await page.getByText("Changes saved.").waitFor();
  const newer = ok(await post("100", "USD", "anonymous"));
  const before = ok(
    await db.from("collections").select("church_name").eq("id", one).single(),
  );
  const after = ok(
    await db.from("collections").select("church_name").eq("id", newer).single(),
  );
  assert.equal(before.church_name, "Calvary Baptist Church");
  assert.equal(after.church_name, "Pilot Church");
  await page.goto(origin + "/audit?entity=church_profile");
  await page.getByText("church_profile", { exact: true }).first().waitFor();
  await inspect(page, "audit");
  ok(
    await db
      .from("church_profile")
      .update({ name: before.church_name })
      .eq("id", true),
  );
} finally {
  await browser.close();
}
console.log(
  "PASS: reconciled USD/LRD reports, statement, CSV escaping, settings audit and immutable receipt headers",
);
