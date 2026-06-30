import type { Activity } from "@/lib/activities/types";
import { getRelativeEffort } from "./index";

export interface PrActivity {
  id: string;
  name: string;
  startDate: string;
}

export interface PersonalRecords {
  longestRun: { activity: PrActivity; distanceKm: number } | null;
  biggestClimb: { activity: PrActivity; elevationM: number } | null;
  highestRelativeEffort: { activity: PrActivity; value: number } | null;
  bestPace5k: { activity: PrActivity; paceSecPerKm: number } | null;
  bestPace10k: { activity: PrActivity; paceSecPerKm: number } | null;
  mostCalories: { activity: PrActivity; calories: number } | null;
}

export interface WeeklyVolumeTrend {
  weekStart: string;
  distanceKm: number;
}

export interface PaceEfficiencyTrend {
  date: string; // activity date
  pacePerHr: number; // lower = more efficient (faster pace per HR unit)
}

function toPrActivity(a: Activity): PrActivity {
  return { id: a.id, name: a.name, startDate: a.startDate };
}

/**
 * Find the minimum average pace over a sliding distance window of `targetMeters`
 * within the activity's streams. Returns seconds-per-km, or null if the activity
 * is shorter than the target distance.
 */
function bestPaceOverDistance(activity: Activity, targetMeters: number): number | null {
  if (activity.distanceMeters < targetMeters) return null;
  const pts = activity.streams.filter((p) => p.pace != null && p.distance != null);
  if (pts.length < 2) {
    // Fall back to overall average pace if streams are sparse
    if (activity.distanceMeters >= targetMeters && activity.averagePace) {
      return activity.averagePace;
    }
    return null;
  }

  let best: number | null = null;
  let lo = 0;

  for (let hi = 0; hi < pts.length; hi++) {
    // Advance lo until window is exactly targetMeters
    while (lo < hi && (pts[hi].distance - pts[lo].distance) > targetMeters) {
      lo++;
    }
    const span = pts[hi].distance - pts[lo].distance;
    if (span < targetMeters * 0.95) continue; // window not long enough yet

    // Average pace over this window
    const paceValues = pts.slice(lo, hi + 1).map((p) => p.pace as number);
    const avg = paceValues.reduce((s, v) => s + v, 0) / paceValues.length;
    if (best === null || avg < best) best = avg;
  }

  return best;
}

export function computePersonalRecords(activities: Activity[]): PersonalRecords {
  // Only run-type activities for pace-based PRs
  const runs = activities.filter((a) =>
    ["Run", "VirtualRun", "TrailRun"].includes(a.type)
  );

  let longestRun: PersonalRecords["longestRun"] = null;
  let biggestClimb: PersonalRecords["biggestClimb"] = null;
  let highestRelativeEffort: PersonalRecords["highestRelativeEffort"] = null;
  let bestPace5k: PersonalRecords["bestPace5k"] = null;
  let bestPace10k: PersonalRecords["bestPace10k"] = null;
  let mostCalories: PersonalRecords["mostCalories"] = null;

  for (const a of activities) {
    const distKm = a.distanceMeters / 1000;
    if (!longestRun || distKm > longestRun.distanceKm) {
      longestRun = { activity: toPrActivity(a), distanceKm: distKm };
    }
    if (!biggestClimb || a.elevationGainMeters > biggestClimb.elevationM) {
      biggestClimb = { activity: toPrActivity(a), elevationM: a.elevationGainMeters };
    }
    const effort = getRelativeEffort(a).value;
    if (!highestRelativeEffort || effort > highestRelativeEffort.value) {
      highestRelativeEffort = { activity: toPrActivity(a), value: effort };
    }
    if (a.calories) {
      if (!mostCalories || a.calories > mostCalories.calories) {
        mostCalories = { activity: toPrActivity(a), calories: a.calories };
      }
    }
  }

  for (const a of runs) {
    const pace5k = bestPaceOverDistance(a, 5000);
    if (pace5k && (!bestPace5k || pace5k < bestPace5k.paceSecPerKm)) {
      bestPace5k = { activity: toPrActivity(a), paceSecPerKm: pace5k };
    }
    const pace10k = bestPaceOverDistance(a, 10000);
    if (pace10k && (!bestPace10k || pace10k < bestPace10k.paceSecPerKm)) {
      bestPace10k = { activity: toPrActivity(a), paceSecPerKm: pace10k };
    }
  }

  return {
    longestRun,
    biggestClimb,
    highestRelativeEffort,
    bestPace5k,
    bestPace10k,
    mostCalories,
  };
}

function startOfWeek(dateIso: string): string {
  const d = new Date(dateIso);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function computeWeeklyVolumeTrend(
  activities: Activity[],
  weeks = 12
): WeeklyVolumeTrend[] {
  const weekMap = new Map<string, number>();
  for (const a of activities) {
    const w = startOfWeek(a.startDate);
    weekMap.set(w, (weekMap.get(w) ?? 0) + a.distanceMeters / 1000);
  }
  const sorted = Array.from(weekMap.entries())
    .map(([weekStart, distanceKm]) => ({ weekStart, distanceKm: Math.round(distanceKm * 10) / 10 }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return sorted.slice(-weeks);
}

export function computePaceEfficiencyTrend(
  activities: Activity[],
  count = 10
): PaceEfficiencyTrend[] {
  return activities
    .filter((a) => a.averagePace != null && a.averageHeartrate != null && a.averageHeartrate > 100)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(-count)
    .map((a) => ({
      date: a.startDate.slice(0, 10),
      // pace in sec/km; lower pace = faster. Normalize by HR so lower = more efficient.
      pacePerHr: Number(((a.averagePace as number) / (a.averageHeartrate as number)).toFixed(3)),
    }));
}
