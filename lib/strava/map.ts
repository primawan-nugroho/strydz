import type { Activity, Athlete, StreamPoint } from "@/lib/activities/types";
import { estimateCalories } from "@/lib/insights/calories";
import type { StravaActivity, StravaAthlete, StravaStreamSet } from "./types";

export function mapAthlete(athlete: StravaAthlete): Athlete {
  return {
    id: String(athlete.id),
    name: `${athlete.firstname} ${athlete.lastname}`.trim(),
    isPremium: Boolean(athlete.premium || athlete.summit),
    profilePictureUrl: athlete.profile ?? athlete.profile_medium ?? null,
  };
}

function speedToPace(metersPerSecond: number | undefined | null): number | null {
  if (!metersPerSecond || metersPerSecond <= 0) return null;
  return Number((1000 / metersPerSecond / 60).toFixed(2));
}

export function mapActivitySummary(athleteId: string, activity: StravaActivity): Activity {
  const type = activity.sport_type ?? activity.type;
  const calories = activity.calories ?? null;
  return {
    id: String(activity.id),
    athleteId,
    name: activity.name,
    type,
    startDate: activity.start_date,
    distanceMeters: activity.distance,
    movingSeconds: activity.moving_time,
    elevationGainMeters: Math.round(activity.total_elevation_gain ?? 0),
    averageHeartrate: activity.average_heartrate ?? null,
    averagePace: speedToPace(activity.average_speed),
    averageWatts: activity.average_watts ?? null,
    calories: calories ?? estimateCalories(type, activity.moving_time),
    caloriesEstimated: calories == null,
    premium: mapPremiumFields(activity),
    streams: [],
    summaryPolyline: activity.map?.summary_polyline ?? activity.map?.polyline ?? "",
  };
}

function mapPremiumFields(activity: StravaActivity): Activity["premium"] {
  return {
    relativeEffort: activity.suffer_score ?? null,
    // Strava's Fitness & Freshness graph and best-power curve are rendered in the Strava
    // app/web UI but are NOT exposed by the public REST API for any account tier — these
    // stay null for live data and always resolve through lib/insights' computed fallback.
    fitnessScore: null,
    freshnessScore: null,
    powerCurve: null,
    segmentEfforts: (activity.segment_efforts ?? []).slice(0, 5).map((e) => ({
      id: String(e.id),
      name: e.name,
      elapsedSeconds: e.elapsed_time,
      isPr: e.pr_rank === 1,
      leaderboardRank: null,
      leaderboardTotal: null,
    })),
  };
}

export function mapActivityDetail(
  athleteId: string,
  activity: StravaActivity,
  streamSet: StravaStreamSet
): Activity {
  const summary = mapActivitySummary(athleteId, activity);
  return { ...summary, streams: mapStreams(streamSet) };
}

function mapStreams(streamSet: StravaStreamSet): StreamPoint[] {
  const length =
    streamSet.time?.data.length ??
    streamSet.distance?.data.length ??
    streamSet.latlng?.data.length ??
    0;

  const points: StreamPoint[] = [];
  for (let i = 0; i < length; i++) {
    points.push({
      t: streamSet.time?.data[i] ?? 0,
      distance: streamSet.distance?.data[i] ?? 0,
      pace: speedToPace(streamSet.velocity_smooth?.data[i]),
      heartrate: streamSet.heartrate?.data[i] ?? null,
      elevation: streamSet.altitude?.data[i] != null ? Math.round(streamSet.altitude.data[i]) : null,
      cadence: streamSet.cadence?.data[i] ?? null,
      watts: streamSet.watts?.data[i] ?? null,
      latlng: streamSet.latlng?.data[i] ?? null,
    });
  }
  return points;
}
