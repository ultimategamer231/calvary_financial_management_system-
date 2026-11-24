import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "@playwright/test";
import { fixtureStaff, login, inspect, origin } from "./check-collections.mjs";
const [a, b] = await fixtureStaff(),
  db = a.db;
const unwrap = (r) => {
  assert.ifError(r.error);
  return r.data;
};
const cat = unwrap(
  await db.from("categories").select("id").eq("name", "Meeting Dues").single(),
).id;
const members = unwrap(
  await db
    .from("members")
    .insert([{ name: "Pilot Member One" }, { name: "Pilot Member Two" }])
    .select("id"),
);
const assignment = {
  amount: "5000",
  category: cat,
  date: "2026-12-01",
  currency: "USD",
  group: "Pilot group",
  members: members.map((m) => m.id),
};
const batch = randomUUID();
unwrap(await db.rpc("assign_dues", { batch_key: batch, entry: assignment }));
const dues = unwrap(await db.from("dues_balances").select().eq("batch", batch));
assert.equal(dues.length, 2);
const o = dues[0];
const entry = {
  kind: "member",
  member: o.member_id,
  date: "2026-01-02",
  method: "Cash",
  currency: "USD",
  total: "3000",
  lines: [{ category: cat, obligation: o.id, amount: "3000" }],
};
const pay = (client, entry) =>
  client.rpc("post_collection", { request_key_input: randomUUID(), entry });
const raced = await Promise.all([pay(db, entry), pay(b.db, entry)]);
assert.equal(raced.filter((r) => !r.error).length, 1);
const balance = async () =>
  unwrap(
    await db
      .from("dues_balances")
      .select("outstanding")
      .eq("id", o.id)
      .single(),
  ).outstanding;
assert.equal(await balance(), 2000);
assert.ok(
  (
    await pay(db, {
      ...entry,
      total: "2500",
      lines: [{ category: cat, obligation: o.id, amount: "2500" }],
    })
  ).error,
);
const split = unwrap(
  await pay(db, {
    ...entry,
    total: "2500",
    lines: [
      { category: cat, obligation: o.id, amount: "2000" },
      { category: cat, amount: "500" },
    ],
  }),
);
assert.equal(await balance(), 0);
unwrap(
  await b.db.rpc("void_collection", {
    target: split,
    explanation: "Pilot reversal",
  }),
);
assert.equal(await balance(), 2000);
assert.ok(
  (
    await db.rpc("cancel_obligation", {
      target: o.id,
      explanation: "Already paid",
    })
  ).error,
);
unwrap(
  await db.rpc("cancel_obligation", {
    target: dues[1].id,
    explanation: "Assigned in error",
  }),
);
const expense = {
  date: "2026-01-02",
  amount: "4000",
  currency: "USD",
  method: "Cash",
  category: "Supplies",
  payee: "Pilot Vendor",
  description: "Pilot supplies",
};
const k = randomUUID();
const post = (client, key, e) =>
  client.rpc("post_expense", { request_key_input: key, entry: e });
const expenseId = unwrap(await post(db, k, expense));
assert.equal(unwrap(await post(db, k, expense)), expenseId);
assert.ok(
  (
    await post(b.db, randomUUID(), {
      ...expense,
      replaces: expenseId,
      reason: "Pilot correction",
      amount: "0",
    })
  ).error,
);
const corrected = unwrap(
  await post(b.db, randomUUID(), {
    ...expense,
    replaces: expenseId,
    reason: "Pilot correction",
    amount: "4100",
  }),
);
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
try {
  const page = await login(browser, a);
  await page.goto(origin + "/dues");
  await page.getByRole("heading", { name: "Dues & commitments" }).waitFor();
  await inspect(page, "dues");
  await page.goto(origin + "/expenses/" + corrected);
  const file = Buffer.from("%PDF-1.4\nPilot attachment fixture");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "demo.pdf",
      mimeType: "application/pdf",
      buffer: file,
    });
  await page.getByRole("button", { name: "Attach evidence" }).click();
  await page.getByText("Evidence attached.").waitFor();
  const link = await page
    .getByRole("link", { name: "demo.pdf" })
    .getAttribute("href");
  const downloaded = await page.request.get(origin + link);
  assert.equal(downloaded.status(), 200);
  assert.deepEqual(await downloaded.body(), file);
  const anon = await browser.newContext();
  const denied = await anon.request.get(origin + link, { maxRedirects: 0 });
  assert.ok([303, 307, 401, 403].includes(denied.status()));
  await page.goto(origin + "/expenses");
  await inspect(page, "expenses");
} finally {
  await browser.close();
}
console.log(
  "PASS: group snapshot, races, overpayment, voluntary split, void restoration, cancellation, expense correction, private evidence and responsive UI",
);
