import { writeFileSync } from "node:fs";
import { localKeys } from "./local-stack.mjs";
const keys = localKeys();
writeFileSync(
  ".env.local",
  "NEXT_PUBLIC_SUPABASE_URL=" +
    keys.API_URL +
    "\nNEXT_PUBLIC_SUPABASE_ANON_KEY=" +
    keys.ANON_KEY +
    "\n",
  { flag: "wx", mode: 0o600 },
);
console.log("Created .env.local with the local public client configuration.");
