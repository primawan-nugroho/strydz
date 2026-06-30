import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/strava/session";

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/settings", request.url));
  clearSessionCookies(response);
  return response;
}
