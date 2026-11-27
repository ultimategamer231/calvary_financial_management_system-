import { cookies } from "next/headers";
import { authCookieOptions } from "./auth-config";

export const leaseSeconds = 24 * 60 * 60;
export const deviceCookie = "calvary-device";
export const leaseCookie = "calvary-offline";
export async function resetOfflineSession(start = false) {
  const jar = await cookies();
  jar.delete(leaseCookie);
  if (start)
    jar.set(deviceCookie, crypto.randomUUID(), {
      ...authCookieOptions,
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
    });
  else jar.delete(deviceCookie);
}
