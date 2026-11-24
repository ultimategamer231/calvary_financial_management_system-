import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { fixtureStaff, inspect, login, origin } from "./check-collections.mjs";
import { chromium } from "@playwright/test";
const [user] = await fixtureStaff();
const { db } = user;
const original = await db
  .from("collections")
  .select("id,receipt")
  .order("created_at", { ascending: false })
  .limit(1)
  .single();
assert.ifError(original.error);
const browser = await chromium.launch(
  process.env.BROWSER_CHANNEL ? { channel: process.env.BROWSER_CHANNEL } : {},
);
try {
  const page = await login(browser, user);
  for (const [route, heading] of [
    ["/settings", "Settings"],
    ["/expenses/new", "Record expense"],
    ["/contributions/new", "Record contribution"],
    ["/members/new", "Add member"],
    ["/categories/new", "Add category"],
    ["/receipts/" + original.data.id, "Receipt " + original.data.receipt],
  ]) {
    await page.goto(origin + route);
    await page.getByRole("heading", { name: heading, exact: true }).waitFor();
    await inspect(page, heading.replace(/[^a-z0-9-]/gi, "-"));
  }
  const pdf = await page.request.get(page.url() + "/pdf");
  assert.equal(pdf.status(), 200);
  assert.ok((await pdf.body()).includes(Buffer.from("/Subtype /Image")));
  const anon = await browser.newContext();
  const loginPage = await anon.newPage();
  await loginPage.goto(origin + "/login");
  const img = loginPage.getByRole("img", {
    name: "Calvary Baptist Church seal",
  });
  await img.waitFor();
  assert.ok(await img.evaluate((el) => el.complete && el.naturalWidth > 0));
  await inspect(loginPage, "pilot-signin");
  await page.goto(origin + "/account/password");
  const password = randomUUID();
  await page.getByLabel("New password").fill(password);
  await page.getByLabel("Confirm password").fill(password + "x");
  await page.getByRole("button", { name: "Update password" }).click();
  await page.getByText("Passwords must match.").waitFor();
} finally {
  await browser.close();
}
console.log(
  "PASS: branded sign-in, PDF embedded seal, staff forms, keyboard accessibility and password validation",
);
