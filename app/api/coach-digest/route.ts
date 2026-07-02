import { NextResponse } from "next/server";
import { getActivities, getCurrentAthlete } from "@/lib/activities";
import { computeTrainingLoad, computeFitnessSummary, computeNextTraining } from "@/lib/insights";
import { withCache } from "@/lib/strava/cache";
import { generateCoachText, isCoachConfigured } from "@/lib/coach/provider";

const DIGEST_TTL_MS = 24 * 60 * 60 * 1000; // regenerate at most once a day

const SYSTEM_PROMPT = `You are a warm but direct running and endurance coach writing a short weekly
check-in. Write 3–4 sentences summarizing the athlete's week using the specific numbers given.
Compare this week to the trend, call out one specific thing that stood out, and end with one concrete
focus for the coming week. No bullet points, no headers, no filler like "Great job!" or "Keep it up!".
Plain paragraph only.`;

function startOfWeek(date = new Date()): string {
  const d = new Date(date);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function buildDigestPrompt(
  activities: Awaited<ReturnType<typeof getActivities>>
): string | null {
  if (activities.length === 0) return null;

  const load = computeTrainingLoad(activities);
  const fitness = computeFitnessSummary(activities);
  const nextTraining = computeNextTraining(activities);

  const thisWeekStart = startOfWeek();
  const thisWeekActivities = activities.filter(
    (a) => a.startDate.slice(0, 10) >= thisWeekStart
  );

  if (thisWeekActivities.length === 0) {
    return `The athlete has not logged any activities this week (week starting ${thisWeekStart}).
Current fitness level: ${fitness.level}.
7-day training load: ${load.acuteLoad7d} AU, 28-day chronic load: ${load.chronicLoad28d} AU, ACWR: ${load.acwr}.
Last 6 weekly loads (oldest to newest, AU): ${load.weeklyLoad.slice(-6).map((w) => w.load).join(", ")}.
Write a check-in that acknowledges the rest and encourages getting back into a session, referencing the suggested next workout: "${nextTraining.title} — ${nextTraining.detail}"`;
  }

  const totalDistanceKm = thisWeekActivities.reduce((s, a) => s + a.distanceMeters, 0) / 1000;
  const totalMinutes = thisWeekActivities.reduce((s, a) => s + a.movingSeconds, 0) / 60;
  const byType = thisWeekActivities.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});
  const typeStr = Object.entries(byType)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  const hardEfforts = thisWeekActivities.filter((a) => (a.averageHeartrate ?? 0) > 160).length;

  const recentWeeks = load.weeklyLoad.slice(-6);
  const priorWeekLoad = recentWeeks.length >= 2 ? recentWeeks[recentWeeks.length - 2].load : null;
  const thisWeekLoad = recentWeeks.at(-1)?.load ?? load.acuteLoad7d;
  const weekOverWeekPercent =
    priorWeekLoad && priorWeekLoad > 0
      ? Math.round(((thisWeekLoad - priorWeekLoad) / priorWeekLoad) * 100)
      : null;

  return `Week starting ${thisWeekStart}:
Activities this week: ${thisWeekActivities.length} (${typeStr})
Total distance: ${totalDistanceKm.toFixed(1)} km
Total moving time: ${Math.round(totalMinutes)} minutes
Sessions with HR above 160 bpm (hard efforts): ${hardEfforts}
Current fitness level: ${fitness.level} (${fitness.trendPercent >= 0 ? "+" : ""}${fitness.trendPercent}% vs last week)
7-day training load: ${load.acuteLoad7d} AU
28-day chronic load (baseline): ${load.chronicLoad28d} AU
ACWR (acute:chronic ratio): ${load.acwr} — ${load.acwr < 0.8 ? "below baseline" : load.acwr <= 1.3 ? "optimal zone" : load.acwr <= 1.5 ? "building hard" : "above safe limit, injury risk"}
Week-over-week load change: ${weekOverWeekPercent != null ? `${weekOverWeekPercent >= 0 ? "+" : ""}${weekOverWeekPercent}%` : "not enough history"}
Last 6 weekly loads (oldest to newest, AU): ${recentWeeks.map((w) => w.load).join(", ")}
Suggested next session: "${nextTraining.title} — ${nextTraining.detail}"`;
}

export async function GET() {
  if (!isCoachConfigured()) {
    return NextResponse.json({ error: "AI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const athlete = await getCurrentAthlete();
    const weekKey = startOfWeek();

    const digest = await withCache(
      `coach-digest:${athlete.id}:${weekKey}`,
      DIGEST_TTL_MS,
      async () => {
        const activities = await getActivities(athlete.id);
        const prompt = buildDigestPrompt(activities);
        if (!prompt) throw new Error("Not enough activity history for a weekly digest");
        return generateCoachText(SYSTEM_PROMPT, prompt, 220);
      }
    );

    return NextResponse.json({ digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Weekly digest failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
