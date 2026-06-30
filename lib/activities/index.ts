import activitiesData from "@/data/sample/activities.json";
import athletesData from "@/data/sample/athletes.json";
import type { Activity, Athlete } from "./types";

const activities = activitiesData as Activity[];
const athletes = athletesData as Athlete[];

const DEMO_ATHLETE_ID = "athlete-premium";

export async function getCurrentAthlete(): Promise<Athlete> {
  return athletes.find((a) => a.id === DEMO_ATHLETE_ID)!;
}

export async function getActivities(athleteId: string = DEMO_ATHLETE_ID): Promise<Activity[]> {
  return activities
    .filter((a) => a.athleteId === athleteId)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export async function getActivityDetail(id: string): Promise<Activity | null> {
  return activities.find((a) => a.id === id) ?? null;
}

export type { Activity, Athlete, ActivityType, StreamPoint, SegmentEffort, PremiumFields } from "./types";
