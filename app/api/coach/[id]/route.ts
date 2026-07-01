import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getActivityDetail, getActivities } from "@/lib/activities";
import { computeActivityInsight, getRelativeEffort, computeTrainingLoad } from "@/lib/insights";
import { withCache } from "@/lib/strava/cache";

const COACH_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours per activity
const MODEL = "gemini-2.0-flash-lite";

const SYSTEM_PROMPT = `You are a warm but direct running and endurance coach.
Write 3–4 sentences of specific, data-driven feedback about the activity.
Reference actual numbers from the data. End with one concrete recommendation for the next 24–48 hours.
No bullet points, no headers, no filler phrases like "Great job!" or "Keep it up!". Plain paragraph only.`;

function fmtPace(minPerKm: number | null): string {
  if (!minPerKm || minPerKm <= 0) return "unknown";
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

function buildPrompt(
  activity: Awaited<ReturnType<typeof getActivityDetail>>,
  allActivities: Awaited<ReturnType<typeof getActivities>>,
): string {
  if (!activity) return "";

  const insight = computeActivityInsight(activity);
  const effort = getRelativeEffort(activity);
  const load = computeTrainingLoad(allActivities);

  // Find comparable activities (same type, ±25% distance, excluding this one)
  const comparables = allActivities
    .filter(
      (a) =>
        a.id !== activity.id &&
        a.type === activity.type &&
        Math.abs(a.distanceMeters - activity.distanceMeters) / activity.distanceMeters < 0.25
    )
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .slice(0, 3);

  const daysSinceLast = allActivities
    .filter((a) => a.id !== activity.id)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
    .map((a) => Math.floor((new Date(activity.startDate).getTime() - new Date(a.startDate).getTime()) / 86400000))
    .find((d) => d > 0) ?? null;

  const hrZoneStr = insight.hrZones
    .map((z) => `Zone ${z.zone} (${z.label}): ${z.percentTime}%`)
    .join(", ");

  const comparableStr =
    comparables.length > 0
      ? comparables
          .map(
            (a) =>
              `${new Date(a.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${fmtPace(a.averagePace)} avg pace, ${a.averageHeartrate ? Math.round(a.averageHeartrate) + " bpm avg HR" : "no HR"}`
          )
          .join(" | ")
      : "No comparable activities in history";

  return `Activity: ${activity.name}
Type: ${activity.type}
Date: ${new Date(activity.startDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
Distance: ${(activity.distanceMeters / 1000).toFixed(2)} km
Duration: ${Math.round(activity.movingSeconds / 60)} minutes
Avg pace: ${fmtPace(activity.averagePace)}
Avg HR: ${activity.averageHeartrate ? Math.round(activity.averageHeartrate) + " bpm" : "not recorded"}
Elevation gain: ${Math.round(activity.elevationGainMeters)} m
Calories: ${activity.calories ? activity.calories + " kcal" : "not recorded"}
Pace consistency score: ${insight.paceConsistencyPercent}% (100% = perfectly even splits)
Elevation-adjusted effort: ${insight.elevationAdjustedEffort}
Relative effort score: ${effort.value} (source: ${effort.source})
HR zone breakdown: ${hrZoneStr}
Days since previous activity: ${daysSinceLast ?? "unknown"}
Current 7-day training load: ${load.acuteLoad7d} AU
ACWR (acute:chronic workload ratio): ${load.acwr} — ${load.acwr < 0.8 ? "below baseline (detraining risk)" : load.acwr <= 1.3 ? "in the optimal zone" : load.acwr <= 1.5 ? "building hard" : "above safe limit (injury risk)"}
Recent comparable ${activity.type.toLowerCase()}s (similar distance): ${comparableStr}`;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const narrative = await withCache(`coach:${id}`, COACH_TTL_MS, async () => {
      const [activity, allActivities] = await Promise.all([
        getActivityDetail(id),
        getActivities(),
      ]);

      if (!activity) throw new Error("Activity not found");

      const prompt = buildPrompt(activity, allActivities);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 220,
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      return text;
    });

    return NextResponse.json({ narrative });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Coach narrative failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
