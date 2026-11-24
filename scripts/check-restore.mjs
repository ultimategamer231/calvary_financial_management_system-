import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const dbContainer = "supabase_db_calvary-finance",
  storageContainer = "supabase_storage_calvary-finance";
const docker = (...args) =>
  execFileSync("docker", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
const exec = (container, ...args) => docker("exec", container, ...args);
const sql = (db, query) =>
  exec(
    dbContainer,
    "psql",
    "-X",
    "-A",
    "-t",
    "-v",
    "ON_ERROR_STOP=1",
    "-U",
    "supabase_admin",
    "-d",
    db,
    "-c",
    query,
  );
const tag = randomUUID().replaceAll("-", ""),
  dbName = "calvary_restore_" + tag,
  work = "/tmp/" + dbName;
const allowed = sql(
  "postgres",
  "select count(*) from auth.users where email !~ '@example[.]invalid$' or email is null",
);
assert.equal(allowed, "0", "Use a fictional-data stack for the rehearsal.");
let dbCreated = false,
  dbDir = false,
  filesDir = false;
try {
  exec(dbContainer, "mkdir", "-m", "700", work);
  dbDir = true;
  exec(storageContainer, "mkdir", "-m", "700", work);
  filesDir = true;
  exec(
    dbContainer,
    "pg_dump",
    "-U",
    "supabase_admin",
    "-d",
    "postgres",
    "-Fc",
    "-f",
    work + "/database.dump",
  );
  exec(
    storageContainer,
    "tar",
    "-cf",
    work + "/objects.tar",
    "-C",
    "/mnt",
    ".",
  );
  exec(
    dbContainer,
    "createdb",
    "-U",
    "supabase_admin",
    "-T",
    "template0",
    dbName,
  );
  dbCreated = true;
  exec(
    dbContainer,
    "pg_restore",
    "--exit-on-error",
    "-U",
    "supabase_admin",
    "-d",
    dbName,
    work + "/database.dump",
  );
  const tables = sql(
    "postgres",
    "select quote_ident(schemaname)||'.'||quote_ident(tablename) from pg_tables where schemaname in ('public','auth','storage','supabase_migrations') order by 1",
  )
    .split("\n")
    .filter(Boolean);
  for (const table of tables) {
    const checksum =
      "select count(*)::text||':'||coalesce(md5(string_agg(md5(to_jsonb(t)::text),'' order by md5(to_jsonb(t)::text))),'') from " +
      table +
      " t";
    assert.equal(
      sql(dbName, checksum),
      sql("postgres", checksum),
      "Restored data mismatch in " + table,
    );
  }
  const policies =
    "select md5(string_agg(to_jsonb(p)::text,'' order by schemaname,tablename,policyname)) from pg_policies p where schemaname in ('public','storage')";
  assert.equal(sql(dbName, policies), sql("postgres", policies));
  const sequences =
    "select md5(string_agg(to_jsonb(s)::text,'' order by schemaname,sequencename)) from pg_sequences s where schemaname='public'";
  assert.equal(sql(dbName, sequences), sql("postgres", sequences));
  exec(storageContainer, "mkdir", work + "/restored");
  exec(
    storageContainer,
    "tar",
    "-xf",
    work + "/objects.tar",
    "-C",
    work + "/restored",
  );
  exec(storageContainer, "diff", "-qr", "/mnt", work + "/restored");
  const objects = sql(
    dbName,
    "select count(*) from storage.objects where bucket_id='expense-evidence'",
  );
  if (process.argv.includes("--require-evidence"))
    assert.ok(Number(objects) > 0, "Expected a real pilot attachment");
  console.log(
    "PASS: restored " +
      tables.length +
      " tables, RLS policies, sequences and private storage bytes; " +
      objects +
      " evidence objects.",
  );
} finally {
  if (dbCreated) exec(dbContainer, "dropdb", "-U", "supabase_admin", dbName);
  if (dbDir) exec(dbContainer, "rm", "-r", work);
  if (filesDir) exec(storageContainer, "rm", "-r", work);
}
