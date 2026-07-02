import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, writeSessionCookies } from "@/lib/strava/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const scope = request.nextUrl.searchParams.get("scope") ?? "";

  if (error || !code) {
    const response = NextResponse.redirect(new URL("/settings?strava_error=denied", request.url));
    return response;
  }

  // Strava reports the scopes the user actually granted (they can uncheck boxes on the
  // consent screen). Without activity:read_all every /athlete/activities call 401s, so
  // reject the grant now instead of storing a token that can't load anything.
  if (!scope.includes("activity:read_all")) {
    return NextResponse.redirect(new URL("/settings?strava_error=missing_scope", request.url));
  }

  try {
    const tokenSet = await exchangeCodeForToken(code);
    const response = NextResponse.redirect(new URL("/settings?strava_connected=1", request.url));
    writeSessionCookies(response, tokenSet);
    return response;
  } catch {
    return NextResponse.redirect(new URL("/settings?strava_error=exchange_failed", request.url));
  }
}
