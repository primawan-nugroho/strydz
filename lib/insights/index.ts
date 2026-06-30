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

export function computeActivityInsight(activity: Activity): ActivityInsight {
  const paces = activity.streams.map((p) => p.pace).filter((p): p is number => p != null);
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

export function getRelativeEffort(activity: Activity): RelativeEffortResult {
  if (activity.premium.relativeEffort != null) {
    return { value: activity.premium.relativeEffort, source: "strava-premium" };
  }
  const hrPoints = activity.streams.map((p) => p.heartrate).filter((h): h is number => h != null);
  const trimp = hrPoints.reduce((sum, hr) => {
    const ratio = hr / ASSUMED_MAX_HR;
    return sum + ratio * ratio * (activity.movingSeconds / 60 / (hrPoints.length || 1));
  }, 0);
  return { value: Math.round(trimp * 10), source: "computed-fallback" };
}

export function getEffortCurve(activity: Activity): EffortCurveResult {
  if (activity.premium.powerCurve) {
    return {
      points: activity.premium.powerCurve.map((p) => ({ duration: p.duration, value: p.watts })),
      metric: "power",
      source: "strava-premium",
    };
  }
  const paces = activity.streams.map((p) => p.pace).filter((p): p is number => p != null);
  const best = paces.length ? Math.min(...paces) : 0;
  const windows = [
    { duration: "1min", factor: 1.0 },
    { duration: "5min", factor: 1.08 },
    { duration: "20min", factor: 1.2 },
  ];
  return {
    points: windows.map((w) => ({ duration: w.duration, value: Number((best * w.factor).toFixed(2)) })),
    metric: "pace",
    source: "computed-fallback",
  };
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
