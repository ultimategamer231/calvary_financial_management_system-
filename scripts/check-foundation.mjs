import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { localKeys } from "./local-stack.mjs";

const keys = localKeys();
const client = (key) =>
  createClient(keys.API_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
const admin = client(keys.SERVICE_ROLE_KEY);
const anon = client(keys.ANON_KEY);
const sql = (query) =>
  execFileSync(
    "docker",
    [
      "exec",
      "supabase_db_calvary-finance",
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-Atc",
      query,
    ],
    { encoding: "utf8" },
  ).trim();
assert.equal(
  sql("select count(*) from public.staff_slots where user_id is not null"),
  "0",
  "Use a fresh, unassigned local test stack",
);
const users = [];
let browser;
const origin = "http://localhost:3107";
async function accessible(page) {
  const report = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    report.violations
      .filter((v) => ["serious", "critical"].includes(v.impact))
      .map((v) => v.id),
    [],
  );
}
try {
  const signup = await anon.auth.signUp({
    email: randomUUID() + "@example.invalid",
    password: randomUUID(),
  });
  assert.ok(signup.error, "Public signup must be disabled");
  assert.ok((await anon.from("staff_slots").select()).error);
  const labels = ["Finance Admin", "Finance Assistant", null];
  for (const label of labels) {
    const email = randomUUID() + "@example.invalid",
      password = randomUUID();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    assert.ifError(created.error);
    const id = created.data.user.id;
    users.push({ id, email, password, label });
    if (label)
      sql(
        "update public.staff_slots set user_id='" +
          id +
          "' where label='" +
          label +
          "' and user_id is null",
      );
  }
  browser = await chromium.launch(
    process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
  );
  mkdirSync("test-results", { recursive: true });
  const anonPage = await (await browser.newContext()).newPage();
  await anonPage.goto(origin + "/dashboard");
  await anonPage.waitForURL("**/login");
  for (const width of [360, 390, 1280]) {
    await anonPage.setViewportSize({ width, height: 800 });
    await accessible(anonPage);
    assert.ok(
      await anonPage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await anonPage.screenshot({ path: "test-results/login-" + width + ".png" });
  }
  await anonPage.context().close();
  for (const { id, email, password, label } of users) {
    const db = client(keys.ANON_KEY);
    assert.ifError(
      (await db.auth.signInWithPassword({ email, password })).error,
    );
    const slots = await db.from("staff_slots").select("label");
    assert.ifError(slots.error);
    assert.deepEqual(slots.data, label ? [{ label }] : []);
    assert.ok(
      (
        await db
          .from("staff_slots")
          .update({ user_id: id })
          .eq("label", "Finance Admin")
      ).error,
    );
    assert.ok(
      (
        await db
          .from("staff_assignment_history")
          .delete()
          .eq("label", "Finance Admin")
      ).error,
    );
    const history = await db.from("staff_assignment_history").select("id");
    assert.ifError(history.error);
    assert.equal(history.data.length > 0, Boolean(label));
    const page = await (await browser.newContext()).newPage();
    await page.goto(origin + "/login");
    await page.getByLabel("Email address").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    if (label) {
      await page.waitForURL("**/dashboard");
      await page.getByText("Signed in as " + label + ".").waitFor();
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await accessible(page);
        await page.screenshot({
          path: "test-results/dashboard-" + width + ".png",
        });
      }
      await page.getByRole("link", { name: "My account" }).click();
      await page.getByText(email, { exact: true }).waitFor();
      if (label === "Finance Admin") {
        sql(
          "update public.staff_slots set user_id=null where user_id='" +
            id +
            "'",
        );
        const revoked = await db.from("staff_assignment_history").select("id");
        assert.ifError(revoked.error);
        assert.deepEqual(revoked.data, []);
        await page.reload();
        await page.waitForURL("**/login?error=access");
      } else {
        await page.getByRole("button", { name: "Sign out" }).click();
        await page.waitForURL("**/login");
        await page.goto(origin + "/account");
        await page.waitForURL("**/login");
      }
    } else {
      await page
        .getByRole("alert")
        .getByText("Your account has no active staff assignment.")
        .waitFor();
    }
    await page.context().close();
  }
  console.log(
    "PASS: signup disabled, anonymous denial, two equal staff sessions, unassigned and revoked denial, immutable assignments/history, sign-out, responsive layouts and axe.",
  );
} finally {
  try {
    await browser?.close();
  } finally {
    for (const { id } of users)
      assert.ifError((await admin.auth.admin.deleteUser(id)).error);
  }
}
