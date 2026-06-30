import { NextRequest, NextResponse } from "next/server";
import { writeSessionCookies } from "@/lib/strava/session";
import { getAthlete } from "@/lib/strava/api";

/**
 * Dev convenience: bootstrap a session from the access/refresh token pair shown on
 * Strava's "My API Application" settings page, skipping the browser consent screen.
 * Real users should go through /api/strava/authorize instead.
 */
export async function POST(request: NextRequest) {
  const accessToken = process.env.STRAVA_SEED_ACCESS_TOKEN;
  const refreshToken = process.env.STRAVA_SEED_REFRESH_TOKEN;

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/settings?strava_error=no_seed", request.url));
  }

  try {
    const athlete = await getAthlete(accessToken);
    const response = NextResponse.redirect(new URL("/settings?strava_connected=1", request.url));
    writeSessionCookies(response, {
      accessToken,
      refreshToken,
      expiresAtSeconds: Math.floor(Date.now() / 1000) + 6 * 60 * 60,
      athleteId: String(athlete.id),
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?strava_error=seed_failed", request.url));
  }
}
