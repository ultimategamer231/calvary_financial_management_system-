import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/session";
import { choices } from "@/lib/collections";
import { authCookieOptions } from "@/lib/auth-config";
import { deviceCookie, leaseCookie, leaseSeconds } from "@/lib/offline-session";

export async function POST(request: NextRequest) {
  const reply = (status: number, body = {}) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "private, no-store" },
    });
  // A custom header prevents cross-origin form submissions, including behind proxies.
  if (
    request.headers.get("x-calvary-offline") !== "1" ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return reply(403);
  const marker = request.cookies.get(deviceCookie)?.value;
  if (!marker || !/^[a-f0-9-]{36}$/i.test(marker)) return reply(401);
  const db = await database();
  const {
    data: { user },
    error: authError,
  } = await db.auth.getUser();
  if (!user)
    return reply(authError && (authError.status ?? 500) >= 500 ? 503 : 401);
  const staff = await db
    .from("staff_slots")
    .select("label")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff.error) return reply(503);
  if (!staff.data) return reply(403);
  const op = request.nextUrl.searchParams.get("op");
  if (op === "prepare") {
    const key = await db.rpc("offline_storage_key");
    if (key.error || !key.data) return reply(503);
    const options = await choices();
    const expires = Date.now() + leaseSeconds * 1000;
    const response = reply(200, { owner: user.id, options });
    response.cookies.set(
      leaseCookie,
      [marker, user.id, expires, key.data].join("."),
      {
        ...authCookieOptions,
        httpOnly: false,
        maxAge: leaseSeconds,
      },
    );
    return response;
  }
  if (op !== "post") return reply(400);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return reply(415);
  const reader = request.body?.getReader();
  if (!reader) return reply(400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 32768) {
      await reader.cancel();
      return reply(413);
    }
    chunks.push(value);
  }
  let input;
  try {
    input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return reply(400);
  }
  if (input?.owner !== user.id) return reply(403);
  if (
    !/^[a-f0-9-]{36}$/i.test(input.key) ||
    !input.entry ||
    input.entry.replaces ||
    !Array.isArray(input.entry.lines)
  )
    return reply(400);
  const { data, error } = await db.rpc("post_collection", {
    request_key_input: input.key,
    entry: input.entry,
  });
  if (error) {
    const validation = /^(P000[123]|22|23)/.test(error.code);
    return reply(validation ? 422 : 503);
  }
  return reply(200, { receipt: data });
}
