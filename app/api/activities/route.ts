import { NextRequest, NextResponse } from "next/server";
import { getActivitiesPage } from "@/lib/activities";

export async function GET(request: NextRequest) {
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? "1"));
  const activities = await getActivitiesPage(page);
  return NextResponse.json(activities);
}
