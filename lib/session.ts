import { authConfigured, authCookieOptions } from "./auth-config";
import type { Database } from "./database.types";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function database() {
  if (!authConfigured()) redirect("/login");
  const jar = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          // Server components read cookies. The proxy persists refreshes before rendering.
          try {
            for (const { name, value, options } of values)
              jar.set(name, value, options);
          } catch {
            /* Cookie store is read-only during rendering. */
          }
        },
      },
    },
  );
}

export async function requireStaff() {
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await db
    .from("staff_slots")
    .select("label")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Staff access could not be verified.");
  if (!data) redirect("/login?error=access");
  return { id: user.id, label: String(data.label), email: user.email };
}
