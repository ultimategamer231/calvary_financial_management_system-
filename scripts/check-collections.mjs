import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { localKeys } from "./local-stack.mjs";
export async function fixtureStaff() {
  const keys = localKeys();
  return Promise.all(
    readFileSync(".env.demo", "utf8")
      .trim()
      .split(/\r?\n\r?\n/)
      .map(async (block) => {
        const [, email, password] = block.split(/\r?\n/);
        const db = createClient(keys.API_URL, keys.ANON_KEY, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        assert.ifError(
          (await db.auth.signInWithPassword({ email, password })).error,
        );
        return { db, email, password };
      }),
  );
}
export const origin = "http://localhost:3107";
export async function login(browser, user) {
  const page = await (await browser.newContext()).newPage();
  await page.goto(origin + "/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  return page;
}
export async function inspect(page, name) {
  mkdirSync("test-results", { recursive: true });
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 830 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const result = await new AxeBuilder({ page }).analyze();
    assert.deepEqual(
      result.violations
        .filter((v) => ["critical", "serious"].includes(v.impact))
        .map((v) => v.id),
      [],
    );
    await page.screenshot({
      path: "test-results/" + name + "-" + width + ".png",
    });
  }
}
async function check() {
  const [a, b] = await fixtureStaff();
  const cat = (
    await a.db
      .from("active_categories")
      .select("id,name")
      .eq("name", "Budget Support")
      .single()
  ).data;
  const entry = {
    kind: "anonymous",
    date: "2026-01-01",
    currency: "LRD",
    method: "Cash",
    total: "50000",
    lines: [{ category: cat.id, amount: "50000" }],
  };
  const key = randomUUID(),
    post = (db, key, entry) =>
      db.rpc("post_collection", { request_key_input: key, entry });
  const pair = await Promise.all([
    post(a.db, key, entry),
    post(a.db, key, entry),
  ]);
  for (const r of pair) assert.ifError(r.error);
  assert.equal(pair[0].data, pair[1].data);
  assert.ok((await post(a.db, key, { ...entry, notes: "different" })).error);
  assert.ok(
    (await post(b.db, randomUUID(), { ...entry, total: "49999" })).error,
  );
  const original = pair[0].data;
  assert.ok(
    (
      await post(b.db, randomUUID(), {
        ...entry,
        replaces: original,
        reason: "Incorrect split",
        total: "1",
      })
    ).error,
  );
  assert.equal(
    (await a.db.from("collection_voids").select().eq("collection_id", original))
      .data.length,
    0,
  );
  const corrected = await post(b.db, randomUUID(), {
    ...entry,
    replaces: original,
    reason: "Correct entered amount",
    total: "50100",
    lines: [{ category: cat.id, amount: "50100" }],
  });
  assert.ifError(corrected.error);
  assert.ok(
    (await a.db.from("collections").update({ total: 5 }).eq("id", original))
      .error,
  );
  const browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  try {
    const page = await login(browser, b);
    await page.goto(origin + "/contributions/new");
    await page.getByLabel("Contributor type").selectOption("guest");
    await page.getByLabel("Guest name").fill("Fictional Guest");
    await page.getByLabel("Category 1").selectOption(cat.id);
    await page.getByLabel("Amount 1").fill("7.05");
    await page.getByRole("button", { name: "Add allocation" }).click();
    await page.getByLabel("Category 2").selectOption({ label: "Meeting Dues" });
    await page.getByLabel("Amount 2").fill("2.95");
    await page.getByRole("button", { name: "Review contribution" }).click();
    await page.getByText("Total USD 10.00").waitFor();
    await page.getByRole("button", { name: "Post contribution" }).click();
    await page.waitForURL("**/receipts/*");
    await page.getByRole("heading", { name: "Total USD 10.00" }).waitFor();
    await inspect(page, "receipt");
    const pdf = await page.request.get(page.url() + "/pdf");
    assert.equal(pdf.status(), 200);
    assert.ok((await pdf.body()).subarray(0, 5).equals(Buffer.from("%PDF-")));
    await page.goto(origin + "/receipts/" + original);
    await page.getByText("VOID", { exact: true }).waitFor();
    await page.getByRole("link", { name: /Replacement CBC-/ }).click();
    await page.getByRole("heading", { name: "Total LRD 501.00" }).waitFor();
  } finally {
    await browser.close();
  }
  console.log(
    "PASS: split posting, concurrency, atomic correction, receipt PDF, USD/LRD and immutable ledger",
  );
}
if (process.argv[1]?.endsWith("check-collections.mjs")) await check();
