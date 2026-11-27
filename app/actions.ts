"use server";
import { resetOfflineSession } from "@/lib/offline-session";
import { redirect } from "next/navigation";
import { database } from "@/lib/session";

export async function signIn(form: FormData) {
  await resetOfflineSession();
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || email.length > 254 || !password || password.length > 1024)
    redirect("/login?error=credentials");
  const db = await database();
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error || !data.user) redirect("/login?error=credentials");
  const slot = await db
    .from("staff_slots")
    .select("label")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (slot.error || !slot.data) {
    await db.auth.signOut({ scope: "local" });
    redirect("/login?error=access");
  }
  await resetOfflineSession(true);
  redirect("/dashboard");
}

export async function signOut() {
  const db = await database();
  await resetOfflineSession();
  const { error } = await db.auth.signOut({ scope: "local" });
  if (error) throw new Error("Sign-out failed. Please retry.");
  redirect("/login");
}
