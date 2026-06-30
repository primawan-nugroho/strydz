import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/strava/session";

export async function GET() {
  return NextResponse.redirect(buildAuthorizeUrl());
}
