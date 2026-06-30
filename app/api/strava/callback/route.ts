import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForToken, writeSessionCookies } from "@/lib/strava/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");

  if (error || !code) {
    const response = NextResponse.redirect(new URL("/settings?strava_error=denied", request.url));
    return response;
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
