import { database } from "@/lib/session";
import { redirect } from "next/navigation";
export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code");
  if (code) {
    const db = await database();
    if (!(await db.auth.exchangeCodeForSession(code)).error)
      redirect("/account/password");
  }
  redirect("/login?error=recovery");
}
