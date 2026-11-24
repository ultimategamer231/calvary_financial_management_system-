import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { openSync, writeFileSync, closeSync, unlinkSync } from "node:fs";
import { localKeys } from "./local-stack.mjs";

const keys = localKeys();
const admin = createClient(keys.API_URL, keys.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
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
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      query,
    ],
    { encoding: "utf8" },
  ).trim();
if (
  sql("select count(*) from public.staff_slots where user_id is not null") !==
  "0"
)
  throw new Error("Seed requires two unassigned slots.");
const fd = openSync(".env.demo", "wx", 0o600);
const users = [];
try {
  for (const [label, email] of [
    ["Finance Admin", "admin@example.invalid"],
    ["Finance Assistant", "assistant@example.invalid"],
  ]) {
    const password = randomUUID();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw created.error;
    users.push({ id: created.data.user.id, label, email, password });
  }
  // Claim both slots together, rolling back if a concurrent operator assigned either one.
  sql(
    "begin; lock table public.staff_slots in exclusive mode; do $$ begin if exists (select 1 from public.staff_slots where user_id is not null) then raise exception 'slots in use'; end if; end $$; " +
      users
        .map(
          (u) =>
            "update public.staff_slots set user_id='" +
            u.id +
            "' where label='" +
            u.label +
            "'",
        )
        .join(";") +
      "; commit;",
  );
  writeFileSync(
    fd,
    users.map((u) => u.label + "\n" + u.email + "\n" + u.password).join("\n\n"),
  );
  console.log(
    "Two local demo accounts created. Credentials are in the ignored .env.demo file.",
  );
} catch (error) {
  for (const { id } of users) await admin.auth.admin.deleteUser(id);
  closeSync(fd);
  unlinkSync(".env.demo");
  throw error;
}
closeSync(fd);
