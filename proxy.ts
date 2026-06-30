import { NextRequest, NextResponse } from "next/server";
import { isExpiringSoon, refreshAccessToken } from "@/lib/strava/oauth";
import { COOKIE_NAMES } from "@/lib/strava/session";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(COOKIE_NAMES.access)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAMES.refresh)?.value;
  const expiresAtSeconds = request.cookies.get(COOKIE_NAMES.expires)?.value;
  const athleteId = request.cookies.get(COOKIE_NAMES.athlete)?.value;

  if (!accessToken || !refreshToken || !expiresAtSeconds || !athleteId) {
    return NextResponse.next();
  }

  const tokenSet = {
    accessToken,
    refreshToken,
    expiresAtSeconds: Number(expiresAtSeconds),
    athleteId,
  };

  if (!isExpiringSoon(tokenSet)) {
    return NextResponse.next();
  }

  try {
    const refreshed = await refreshAccessToken(tokenSet.refreshToken, tokenSet.athleteId);
    const response = NextResponse.next();
    const opts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    };
    response.cookies.set(COOKIE_NAMES.access, refreshed.accessToken, opts);
    response.cookies.set(COOKIE_NAMES.refresh, refreshed.refreshToken, opts);
    response.cookies.set(COOKIE_NAMES.expires, String(refreshed.expiresAtSeconds), opts);
    response.cookies.set(COOKIE_NAMES.athlete, refreshed.athleteId, opts);
    return response;
  } catch {
    // Refresh failed (revoked, network, etc). Let the request through with the stale
    // token — the data layer's own fetch will fail and fall back to demo data.
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
