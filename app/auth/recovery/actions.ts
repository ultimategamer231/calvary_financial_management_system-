"use server";
import { database, requireStaff } from "@/lib/session";
import { redirect } from "next/navigation";
export async function requestReset(_prev: string, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  if (!email || email.length > 254) return "Enter a valid email address.";
  const base =
    process.env.APP_ORIGIN ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3107" : "");
  if (!base)
    return "Contact your church account operator for a password reset.";
  const db = await database();
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/auth/recovery", base).href,
  });
  if (error && error.status && error.status >= 500)
    return "Email delivery is unavailable. Contact your church account operator.";
  return "If the address is registered, check your inbox for recovery instructions.";
}
export async function changePassword(_prev: string, form: FormData) {
  await requireStaff();
  const pass = String(form.get("password") ?? "");
  if (pass.length < 12 || pass.length > 128) return "Use 12 to 128 characters.";
  if (pass !== form.get("confirm")) return "Passwords must match.";
  const db = await database();
  const { error } = await db.auth.updateUser({ password: pass });
  if (error) return "Password change failed. Request a fresh recovery link.";
  await db.auth.signOut();
  redirect("/login");
}
