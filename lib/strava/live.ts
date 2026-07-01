import type { Activity, Athlete } from "@/lib/activities/types";
import type { TokenSet } from "./types";
import { getActivityDetail, getActivityStreams, getAthlete, listActivities } from "./api";
import { mapActivityDetail, mapActivitySummary, mapAthlete } from "./map";
import { withCache } from "./cache";

const LIST_TTL_MS = 60_000;
const DETAIL_TTL_MS = 5 * 60_000;

export async function getCurrentAthleteLive(session: TokenSet): Promise<Athlete> {
  const athlete = await withCache(`athlete:${session.athleteId}`, DETAIL_TTL_MS, () =>
    getAthlete(session.accessToken)
  );
  return mapAthlete(athlete);
}

export async function getActivitiesLive(
  session: TokenSet,
  page = 1,
  perPage = 20
): Promise<Activity[]> {
  // Each page/perPage combo gets its own cache key.
  const activities = await withCache(
    `activities:${session.athleteId}:${page}:${perPage}`,
    LIST_TTL_MS,
    () => listActivities(session.accessToken, perPage, page)
  );
  return activities
    .map((a) => mapActivitySummary(session.athleteId, a))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getActivityDetailLive(session: TokenSet, id: string): Promise<Activity | null> {
  const [detail, streams] = await Promise.all([
    withCache(`activity:${id}`, DETAIL_TTL_MS, () => getActivityDetail(session.accessToken, id)),
    withCache(`streams:${id}`, DETAIL_TTL_MS, () => getActivityStreams(session.accessToken, id)),
  ]);
  if (!detail) return null;
  return mapActivityDetail(session.athleteId, detail, streams);
}
