import { authConfigured, authCookieOptions } from "@/lib/auth-config";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  if (!authConfigured()) {
    return request.nextUrl.pathname === "/login"
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));
  }
  let response = NextResponse.next({ request });
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: authCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values) {
          for (const { name, value } of values)
            request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of values)
            response.cookies.set(name, value, options);
        },
      },
    },
  );
  const { data: { user } } = await db.auth.getUser();
  const path = request.nextUrl.pathname;
  if (path === "/login" && request.nextUrl.searchParams.get("error") === "access") {
    response.cookies.delete("calvary-offline");
    response.cookies.delete("calvary-device");
  } else if (user && request.method === "GET" && path === "/dashboard" && !request.cookies.has("calvary-device")) {
    // Prepare browsers that were already signed in when offline support was added.
    response.cookies.set("calvary-device", crypto.randomUUID(), {
      ...authCookieOptions, httpOnly: false, maxAge: 60 * 60 * 24 * 365,
    });
  }
  if (request.nextUrl.pathname === "/login" && request.nextUrl.searchParams.get("error") === "access") {
    response.cookies.delete("calvary-offline");
    response.cookies.delete("calvary-device");
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/receipts/:path*",
    "/contributions/:path*",
    "/expenses/:path*",
    "/dues/:path*",
    "/members/:path*",
    "/categories/:path*",
    "/account/:path*",
    "/login",
    "/settings/:path*",
    "/reports/:path*",
    "/audit/:path*",
    "/recover",
    "/auth/:path*",
  ],
};
