import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { localKeys } from "./local-stack.mjs";

const preview = process.argv.includes("--preview");
const keys = localKeys();
const accounts = readFileSync(".env.demo", "utf8")
  .trim()
  .split(/\r?\n\r?\n/)
  .map((section) => {
    const [label, email, password] = section.split(/\r?\n/);
    return { label, email, password };
  });
const origin = "http://localhost:3107";
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
mkdirSync("test-results", { recursive: true });
async function login(account) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(origin + "/login");
  await page.getByLabel("Email address").fill(account.email);
  await page.getByLabel("Password", { exact: true }).fill(account.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard");
  return page;
}
async function inspect(page, title) {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole("heading", { level: 1 }).waitFor();
    const issues = (await new AxeBuilder({ page }).analyze()).violations.filter(
      (v) => ["critical", "serious"].includes(v.impact),
    );
    assert.deepEqual(
      issues.map((v) => v.id),
      [],
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: "test-results/" + title + "-" + width + ".png",
    });
  }
}
async function verify() {
  const admin = await login(accounts[0]),
    assistant = await login(accounts[1]);
  await admin.getByRole("link", { name: "Members", exact: true }).click();
  await inspect(admin, "members");
  await assistant.getByRole("link", { name: "Payment categories" }).click();
  await assistant
    .getByRole("cell", { name: "Father's day Lappas Sale", exact: true })
    .waitFor();
  await inspect(assistant, "categories");
  if (preview) return;

  const db = createClient(keys.API_URL, keys.ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  assert.ok((await db.from("categories").select()).error);
  assert.ifError(
    (
      await db.auth.signInWithPassword({
        email: accounts[0].email,
        password: accounts[0].password,
      })
    ).error,
  );
  const seeds = [
    "Budget Support",
    "Special Projects (Todee)",
    "Father's Day Contribution",
    "End of Year Program",
    "IBMF T-Shirt",
    "IBMF Program Contribution",
    "Prayer Breakfast",
    "Evangelism",
    "Monthly Offering",
    "Father's day Lappas Sale",
    "Visitation",
    "Meeting Dues",
    "Other Contribution",
  ];
  const initial = await db.from("categories").select("name");
  assert.ifError(initial.error);
  assert.deepEqual(
    initial.data.map((r) => r.name).sort(),
    seeds.sort(),
    "Run the full suite on fresh fixtures",
  );
  const tag = randomUUID().slice(0, 8),
    name = "Demo Member " + tag,
    phone = "555-" + tag;
  await admin.getByRole("link", { name: "Add member" }).click();
  await admin.getByLabel("Full name").fill(name);
  await admin.getByLabel("Phone").fill(phone);
  await admin.getByRole("button", { name: "Save member" }).click();
  await admin.getByRole("heading", { name, exact: true }).waitFor();
  const memberUrl = new URL(admin.url());
  memberUrl.search = "";
  const id = memberUrl.pathname.split("/").pop();
  const number = await admin.getByText(/^CBC-\d+$/).innerText();
  await assistant.goto(origin + "/members");
  for (const query of [phone, number, name]) {
    await assistant.getByLabel("Search members").fill(query);
    await assistant.getByRole("button", { name: "Apply filters" }).click();
    await assistant.waitForURL((url) => url.searchParams.get("q") === query);
    await assistant.getByRole("link", { name, exact: true }).waitFor();
  }
  await assistant.getByRole("link", { name, exact: true }).click();
  await assistant.getByRole("link", { name: "Edit member" }).click();
  await admin.getByRole("link", { name: "Edit member" }).click();
  await assistant.getByLabel("Full name").fill(name + " Revised");
  await assistant.getByLabel("Status").selectOption("inactive");
  await assistant
    .getByLabel("Reason for archiving")
    .fill("Duplicate demo entry");
  await assistant.getByRole("button", { name: "Save member" }).click();
  await assistant.getByText("Archived", { exact: true }).waitFor();
  await admin.getByRole("button", { name: "Save member" }).click();
  await admin
    .getByRole("alert")
    .getByText(/Another staff member/)
    .waitFor();
  assert.ok((await db.from("members").delete().eq("id", id)).error);
  assert.ok(
    (
      await db
        .from("members")
        .update({ active: false, inactive_reason: null })
        .eq("id", id)
    ).error,
  );
  const history = await db
    .from("directory_events")
    .select("*")
    .eq("record_id", id)
    .order("id");
  assert.ifError(history.error);
  assert.deepEqual(
    history.data.map((r) => [r.action, r.staff_label]),
    [
      ["create", "Finance Admin"],
      ["deactivate", "Finance Assistant"],
    ],
  );
  assert.equal(history.data[1].before_record.name, name);
  assert.equal(
    history.data[1].after_record.inactive_reason,
    "Duplicate demo entry",
  );
  assert.ok(
    (await db.from("directory_events").delete().eq("record_id", id)).error,
  );
  await assistant.goto(origin + "/categories/new");
  const category = "Demo Category " + tag;
  await assistant.getByLabel("Category name").fill(category);
  await assistant.getByLabel("Group").fill("Programs");
  await assistant.getByRole("button", { name: "Save category" }).click();
  await assistant.getByRole("status").waitFor();
  await admin.goto(origin + "/categories");
  await admin
    .getByRole("link", { name: "Edit " + category, exact: true })
    .click();
  await admin.waitForURL("**/categories/*/edit");
  const cid = new URL(admin.url()).pathname.split("/")[2];
  await admin.getByLabel("Category name").fill("budget support");
  await admin.getByRole("button", { name: "Save category" }).click();
  await admin
    .getByRole("alert")
    .getByText(/already uses/)
    .waitFor();
  await admin.getByLabel("Category name").fill(category + " Revised");
  await admin.getByLabel("Status").selectOption("inactive");
  await admin.getByLabel("Reason for deactivation").fill("Program closed");
  await admin.getByRole("button", { name: "Save category" }).click();
  await admin.getByText("Category saved.").waitFor();
  const options = () =>
    db.from("active_categories").select("name").eq("id", cid);
  const inactive = await options();
  assert.ifError(inactive.error);
  assert.deepEqual(inactive.data, []);
  await admin
    .getByRole("link", { name: "Edit " + category + " Revised", exact: true })
    .click();
  await admin.getByLabel("Status").selectOption("active");
  await admin.getByRole("button", { name: "Save category" }).click();
  await admin.getByText("Category saved.").waitFor();
  const active = await options();
  assert.ifError(active.error);
  assert.deepEqual(active.data, [{ name: category + " Revised" }]);
  const changes = await db
    .from("directory_events")
    .select("*")
    .eq("record_id", cid)
    .order("id");
  assert.ifError(changes.error);
  assert.equal(changes.data[1].before_record.name, category);
  assert.equal(changes.data[2].after_record.group_name, "Programs");
}
try {
  await verify();
  console.log(
    preview
      ? "PASS: demo accounts and responsive directory screens"
      : "PASS: both staff workflows, search, stale writes, audit history, lifecycle, seeds and responsive screens",
  );
} finally {
  await browser.close();
}
