import activitiesData from "@/data/sample/activities.json";
import athletesData from "@/data/sample/athletes.json";
import { getStravaSession } from "@/lib/strava/session";
import { getActivitiesLive, getActivityDetailLive, getCurrentAthleteLive } from "@/lib/strava/live";
import type { Activity, Athlete } from "./types";

const activities = activitiesData as Activity[];
const athletes = athletesData as Athlete[];

const DEMO_ATHLETE_ID = "athlete-premium";

export type DataSource = "live" | "demo";

async function getSampleAthlete(): Promise<Athlete> {
  return athletes.find((a) => a.id === DEMO_ATHLETE_ID)!;
}

async function getSampleActivities(): Promise<Activity[]> {
  return activities
    .filter((a) => a.athleteId === DEMO_ATHLETE_ID)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

async function getSampleActivityDetail(id: string): Promise<Activity | null> {
  return activities.find((a) => a.id === id) ?? null;
}

/** Fetches the dashboard's athlete + activities together and reports whether the data
 * actually came from Strava or fell back to fixtures — a present session cookie alone
 * doesn't guarantee the live calls succeeded (e.g. insufficient OAuth scope). */
export async function getDashboardData(): Promise<{
  athlete: Athlete;
  activities: Activity[];
  source: DataSource;
  errorDetail?: string;
}> {
  const session = await getStravaSession();
  if (!session) {
    return { athlete: await getSampleAthlete(), activities: await getSampleActivities(), source: "demo" };
  }
  try {
    const [athlete, liveActivities] = await Promise.all([
      getCurrentAthleteLive(session),
      getActivitiesLive(session),
    ]);
    if (liveActivities.length === 0) {
      return { athlete, activities: await getSampleActivities(), source: "demo" };
    }
    return { athlete, activities: liveActivities, source: "live" };
  } catch (err) {
    const errorDetail = err instanceof Error ? err.message : String(err);
    console.error("Strava dashboard fetch failed, falling back to demo data:", errorDetail);
    return {
      athlete: await getSampleAthlete(),
      activities: await getSampleActivities(),
      source: "demo",
      errorDetail,
    };
  }
}

export async function getCurrentAthlete(): Promise<Athlete> {
  const session = await getStravaSession();
  if (!session) return getSampleAthlete();
  try {
    return await getCurrentAthleteLive(session);
  } catch (err) {
    console.error("Strava getCurrentAthlete failed, falling back to demo data:", err);
    return getSampleAthlete();
  }
}

/** athleteId param is accepted for call-site stability; live mode derives it from the
 * session, sample mode always returns the demo athlete's activities. */
export async function getActivities(_athleteId?: string): Promise<Activity[]> {
  const session = await getStravaSession();
  if (!session) return getSampleActivities();
  try {
    const live = await getActivitiesLive(session);
    return live.length > 0 ? live : getSampleActivities();
  } catch (err) {
    console.error("Strava getActivities failed, falling back to demo data:", err);
    return getSampleActivities();
  }
}

const PAGE_SIZE = 20;

/** Paginated fetch — used by the /api/activities route for "load more". */
export async function getActivitiesPage(page: number): Promise<Activity[]> {
  const session = await getStravaSession();
  if (!session) {
    // Paginate the sample fixtures in-memory.
    const all = await getSampleActivities();
    return all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }
  try {
    const live = await getActivitiesLive(session, page, PAGE_SIZE);
    if (live.length > 0) return live;
    // Strava returned empty (past end of history) — no demo fallback for subsequent pages.
    return [];
  } catch (err) {
    console.error("Strava getActivitiesPage failed:", err);
    return [];
  }
}

export async function getActivityDetail(id: string): Promise<Activity | null> {
  const session = await getStravaSession();
  if (!session) return getSampleActivityDetail(id);
  try {
    const live = await getActivityDetailLive(session, id);
    if (live) return live;
  } catch (err) {
    console.error("Strava getActivityDetail failed, falling back to demo data:", err);
  }
  return getSampleActivityDetail(id);
}

/** True when a Strava session cookie is present (does not guarantee live calls succeed —
 * prefer getDashboardData()'s `source` field where accuracy matters, e.g. banners). */
export async function isLiveMode(): Promise<boolean> {
  return (await getStravaSession()) != null;
}

export type { Activity, Athlete, ActivityType, StreamPoint, SegmentEffort, PremiumFields } from "./types";
