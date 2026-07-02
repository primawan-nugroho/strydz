import type { Activity } from "@/lib/activities/types";
import type {
  ActivityInsight,
  EffortCurveResult,
  FitnessSummary,
  HrZoneDistribution,
  NextTraining,
  RelativeEffortResult,
  SegmentPerformanceResult,
  TrainingLoadSummary,
  WeeklyLoadPoint,
} from "./types";

const ASSUMED_MAX_HR = 190;
const ASSUMED_REST_HR = 60;

function activityLoad(activity: Activity): number {
  const minutes = activity.movingSeconds / 60;
  const intensity = activity.averageHeartrate ? activity.averageHeartrate / 145 : 1;
  return minutes * intensity * intensity;
}

function startOfWeek(dateIso: string): string {
  const date = new Date(dateIso);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

export function computeTrainingLoad(activities: Activity[]): TrainingLoadSummary {
  const now = Date.now();
  const dayMs = 86400000;

  const acuteLoad7d = activities
    .filter((a) => now - new Date(a.startDate).getTime() <= 7 * dayMs)
    .reduce((sum, a) => sum + activityLoad(a), 0);

  const chronicLoad28dTotal = activities
    .filter((a) => now - new Date(a.startDate).getTime() <= 28 * dayMs)
    .reduce((sum, a) => sum + activityLoad(a), 0);
  const chronicLoad28d = chronicLoad28dTotal / 4;

  const weekMap = new Map<string, number>();
  for (const activity of activities) {
    const week = startOfWeek(activity.startDate);
    weekMap.set(week, (weekMap.get(week) ?? 0) + activityLoad(activity));
  }
  const weeklyLoad: WeeklyLoadPoint[] = Array.from(weekMap.entries())
    .map(([weekStart, load]) => ({ weekStart, load: Math.round(load) }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  const acwr = chronicLoad28d > 0 ? acuteLoad7d / chronicLoad28d : 0;

  return {
    weeklyLoad,
    acuteLoad7d: Math.round(acuteLoad7d),
    chronicLoad28d: Math.round(chronicLoad28d),
    acwr: Number(acwr.toFixed(2)),
  };
}

export function computeFitnessSummary(activities: Activity[]): FitnessSummary {
  const { acwr, weeklyLoad } = computeTrainingLoad(activities);

  let level: FitnessSummary["level"] = "Maintaining";
  if (acwr < 0.8) level = "Detraining";
  else if (acwr < 1.1) level = "Maintaining";
  else if (acwr < 1.5) level = "Building";
  else level = "Peaking";

  const last = weeklyLoad.at(-1)?.load ?? 0;
  const prev = weeklyLoad.at(-2)?.load ?? 0;
  const trendPercent = prev > 0 ? Math.round(((last - prev) / prev) * 100) : 0;

  return { level, trendPercent };
}

export function computeNextTraining(activities: Activity[]): NextTraining {
  const { acwr } = computeTrainingLoad(activities);
  const sorted = [...activities].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const last = sorted[0];
  const daysSinceLast = last
    ? Math.floor((Date.now() - new Date(last.startDate).getTime()) / 86400000)
    : 99;
  const lastWasHard = last ? (last.averageHeartrate ?? 0) > 160 : false;
  const daysSinceLong = sorted.findIndex((a) => a.distanceMeters > 14000);

  if (acwr > 1.5) {
    return {
      suggestion: "rest",
      title: "Take a rest day",
      detail: "Your recent training load is well above your baseline — recovery now reduces injury risk.",
    };
  }
  if (daysSinceLast === 0 && lastWasHard) {
    return {
      suggestion: "easy",
      title: "Easy recovery run",
      detail: "Yesterday's effort was hard. Keep today light: 20-30min at a conversational pace.",
    };
  }
  if (daysSinceLong < 0 || daysSinceLong > 6) {
    return {
      suggestion: "long",
      title: "Long run",
      detail: "It's been a while since your last long effort. Aim for 60-90min at an easy, steady pace.",
    };
  }
  if (!lastWasHard) {
    return {
      suggestion: "tempo",
      title: "Tempo run",
      detail: "6km at a comfortably hard pace, then 10min easy to cool down.",
    };
  }
  return {
    suggestion: "interval",
    title: "Interval session",
    detail: "6x800m at a hard effort with 2min recovery jogs between reps.",
  };
}

/** Splits the activity into per-segment paces (min/km) using the distance/time streams.
 * Segment paces are what runners mean by "consistency" — instantaneous GPS pace is far too
 * noisy to judge it. */
function computeSplitPaces(activity: Activity, splitMeters = 1000): number[] {
  const track = activity.streams.filter((p) => p.distance != null);
  if (track.length < 2) return [];

  const splits: number[] = [];
  let segStartT = track[0].t;
  let segStartDist = track[0].distance;

  for (const p of track) {
    const dist = p.distance - segStartDist;
    if (dist >= splitMeters) {
      const minutes = (p.t - segStartT) / 60;
      splits.push(minutes / (dist / 1000));
      segStartT = p.t;
      segStartDist = p.distance;
    }
  }
  // Include a meaningful final partial split (at least half length) so short activities
  // aren't judged on one segment fewer than they earned.
  const last = track[track.length - 1];
  const tailDist = last.distance - segStartDist;
  if (tailDist >= splitMeters / 2) {
    const minutes = (last.t - segStartT) / 60;
    splits.push(minutes / (tailDist / 1000));
  }
  return splits;
}

export function computeActivityInsight(activity: Activity): ActivityInsight {
  // Consistency = 100 − coefficient of variation of per-km split paces. Splits absorb GPS
  // noise and brief stops; a metronomic run scores in the 90s, a strong fade or walk/run
  // mix lands much lower. Falls back to clamped raw samples when there are too few splits.
  let paces = computeSplitPaces(activity);
  if (paces.length < 3) {
    const rawPaces = activity.streams.map((p) => p.pace).filter((p): p is number => p != null);
    const sorted = [...rawPaces].sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)] ?? 0;
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    paces = rawPaces.map((p) => Math.min(Math.max(p, p5), p95));
  }
  const mean = paces.reduce((sum, p) => sum + p, 0) / (paces.length || 1);
  const variance = paces.reduce((sum, p) => sum + (p - mean) ** 2, 0) / (paces.length || 1);
  const stdDev = Math.sqrt(variance);
  const paceConsistencyPercent = mean > 0 ? Math.max(0, Math.round(100 - (stdDev / mean) * 100)) : 0;

  const elevationAdjustedEffort = Math.round(
    activity.distanceMeters / 1000 + (activity.elevationGainMeters / 100) * 0.8
  );

  const zoneLabels: Record<HrZoneDistribution["zone"], string> = {
    1: "Recovery",
    2: "Easy",
    3: "Aerobic",
    4: "Threshold",
    5: "Max",
  };
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const hrPoints = activity.streams.map((p) => p.heartrate).filter((h): h is number => h != null);
  for (const hr of hrPoints) {
    const pct = hr / ASSUMED_MAX_HR;
    const zone = pct < 0.6 ? 1 : pct < 0.7 ? 2 : pct < 0.8 ? 3 : pct < 0.9 ? 4 : 5;
    counts[zone] += 1;
  }
  const total = hrPoints.length || 1;
  const hrZones: HrZoneDistribution[] = [1, 2, 3, 4, 5].map((zone) => ({
    zone: zone as HrZoneDistribution["zone"],
    label: zoneLabels[zone as HrZoneDistribution["zone"]],
    percentTime: Math.round((counts[zone] / total) * 100),
  }));

  return { paceConsistencyPercent, elevationAdjustedEffort, hrZones };
}

/** Banister TRIMP: per-sample `minutes × HRr × 0.64 × e^(1.92·HRr)` where HRr is heart-rate
 * reserve. Exponential weighting means a threshold hour scores ~2.5× an easy hour (the old
 * quadratic version only managed ~1.6×, understating hard sessions). HRrest/HRmax are
 * population assumptions — good enough for trends, could become per-user settings later.
 * Scaled to roughly line up with Strava's suffer-score bands in benchmarks.ts. */
export function getRelativeEffort(activity: Activity): RelativeEffortResult {
  if (activity.premium.relativeEffort != null) {
    return { value: activity.premium.relativeEffort, source: "strava-premium" };
  }
  const hrPoints = activity.streams.map((p) => p.heartrate).filter((h): h is number => h != null);
  if (hrPoints.length === 0) return { value: 0, source: "computed-fallback" };

  const minutesPerSample = activity.movingSeconds / 60 / hrPoints.length;
  const hrRange = ASSUMED_MAX_HR - ASSUMED_REST_HR;
  const trimp = hrPoints.reduce((sum, hr) => {
    const hrr = Math.min(1, Math.max(0, (hr - ASSUMED_REST_HR) / hrRange));
    return sum + minutesPerSample * hrr * 0.64 * Math.exp(1.92 * hrr);
  }, 0);
  return { value: Math.round(trimp), source: "computed-fallback" };
}

/** Best average pace sustained over a given duration, found by sliding a time window over
 * the time/distance streams and taking the max distance covered inside it. Returns min/km,
 * or null if the activity is shorter than the window. */
function bestPaceOverDuration(
  points: { t: number; distance: number }[],
  windowSeconds: number
): number | null {
  if (points.length < 2) return null;
  const totalTime = points[points.length - 1].t - points[0].t;
  if (totalTime < windowSeconds) return null;

  let bestDistance = 0;
  let lo = 0;
  for (let hi = 1; hi < points.length; hi++) {
    while (points[hi].t - points[lo].t > windowSeconds) lo++;
    const span = points[hi].t - points[lo].t;
    if (span < windowSeconds * 0.9) continue; // window not yet full
    const dist = points[hi].distance - points[lo].distance;
    // Normalize to the exact window length so shorter spans don't win unfairly
    const normalized = dist * (windowSeconds / span);
    if (normalized > bestDistance) bestDistance = normalized;
  }

  if (bestDistance <= 0) return null;
  const paceMinPerKm = windowSeconds / 60 / (bestDistance / 1000);
  return Number(paceMinPerKm.toFixed(2));
}

export function getEffortCurve(activity: Activity): EffortCurveResult {
  if (activity.premium.powerCurve) {
    return {
      points: activity.premium.powerCurve.map((p) => ({ duration: p.duration, value: p.watts })),
      metric: "power",
      source: "strava-premium",
    };
  }
  // True best-effort curve computed from the streams (the old version multiplied the single
  // fastest GPS sample by made-up factors — decorative, not real data).
  const track = activity.streams
    .filter((p) => p.distance != null)
    .map((p) => ({ t: p.t, distance: p.distance }));

  const windows = [
    { duration: "1min", seconds: 60 },
    { duration: "5min", seconds: 300 },
    { duration: "20min", seconds: 1200 },
  ];
  const points = windows
    .map((w) => ({ duration: w.duration, value: bestPaceOverDuration(track, w.seconds) }))
    .filter((p): p is { duration: string; value: number } => p.value != null);

  return { points, metric: "pace", source: "computed-fallback" };
}

export function getSegmentPerformance(activity: Activity): SegmentPerformanceResult {
  if (!activity.premium.segmentEfforts || activity.premium.segmentEfforts.length === 0) {
    return { available: false, efforts: [] };
  }
  return {
    available: true,
    efforts: activity.premium.segmentEfforts.map((e) => ({
      name: e.name,
      elapsedSeconds: e.elapsedSeconds,
      isPr: e.isPr,
      rank:
        e.leaderboardRank != null && e.leaderboardTotal != null
          ? `${e.leaderboardRank} of ${e.leaderboardTotal}`
          : "—",
    })),
  };
}

export function getFitnessFreshnessTrend(activities: Activity[]): {
  points: { date: string; value: number }[];
  source: "strava-premium" | "computed-fallback";
} {
  const withScore = activities.find((a) => a.premium.fitnessScore != null);
  if (withScore) {
    return {
      points: activities
        .filter((a) => a.premium.fitnessScore != null)
        .map((a) => ({ date: a.startDate.slice(0, 10), value: a.premium.fitnessScore! })),
      source: "strava-premium",
    };
  }
  const { weeklyLoad } = computeTrainingLoad(activities);
  return {
    points: weeklyLoad.map((w) => ({ date: w.weekStart, value: w.load })),
    source: "computed-fallback",
  };
}
