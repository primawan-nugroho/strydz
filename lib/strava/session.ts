import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { TokenSet } from "./types";

export { buildAuthorizeUrl, exchangeCodeForToken, refreshAccessToken, isExpiringSoon } from "./oauth";

const COOKIE_ACCESS = "strava_access_token";
const COOKIE_REFRESH = "strava_refresh_token";
const COOKIE_EXPIRES = "strava_expires_at";
const COOKIE_ATHLETE = "strava_athlete_id";

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

/** Read-only: safe to call from Server Components and Route Handlers. */
export async function getStravaSession(): Promise<TokenSet | null> {
  const store = await cookies();
  const accessToken = store.get(COOKIE_ACCESS)?.value;
  const refreshToken = store.get(COOKIE_REFRESH)?.value;
  const expiresAtSeconds = store.get(COOKIE_EXPIRES)?.value;
  const athleteId = store.get(COOKIE_ATHLETE)?.value;
  if (!accessToken || !refreshToken || !expiresAtSeconds || !athleteId) return null;
  return { accessToken, refreshToken, expiresAtSeconds: Number(expiresAtSeconds), athleteId };
}

/** Mutates cookies on a NextResponse — only valid in Route Handlers and Middleware. */
export function writeSessionCookies(response: NextResponse, tokenSet: TokenSet) {
  response.cookies.set(COOKIE_ACCESS, tokenSet.accessToken, COOKIE_OPTS);
  response.cookies.set(COOKIE_REFRESH, tokenSet.refreshToken, COOKIE_OPTS);
  response.cookies.set(COOKIE_EXPIRES, String(tokenSet.expiresAtSeconds), COOKIE_OPTS);
  response.cookies.set(COOKIE_ATHLETE, tokenSet.athleteId, COOKIE_OPTS);
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [COOKIE_ACCESS, COOKIE_REFRESH, COOKIE_EXPIRES, COOKIE_ATHLETE]) {
    response.cookies.set(name, "", { ...COOKIE_OPTS, maxAge: 0 });
  }
}

export const COOKIE_NAMES = {
  access: COOKIE_ACCESS,
  refresh: COOKIE_REFRESH,
  expires: COOKIE_EXPIRES,
  athlete: COOKIE_ATHLETE,
};
