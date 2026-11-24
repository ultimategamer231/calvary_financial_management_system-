import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { join, dirname } from "node:path";

const require = createRequire(import.meta.url);
export function localKeys() {
  const pkgDir = dirname(require.resolve("supabase/package.json"));
  const cli = join(pkgDir, "dist", "supabase.js");
  const status = execFileSync(process.execPath, [cli, "status", "-o", "env"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const entries = Object.fromEntries(
    status
      .trim()
      .split(/\r?\n/)
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i), line.slice(i + 1).replace(/^"|"$/g, "")];
      }),
  );
  if (
    entries.API_URL !== "http://127.0.0.1:55321" ||
    !entries.ANON_KEY ||
    !entries.SERVICE_ROLE_KEY
  )
    throw new Error("Expected the isolated local Calvary Supabase stack.");
  return entries;
}
