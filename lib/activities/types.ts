export type ActivityType = "Run" | "Ride" | "Swim";

export interface StreamPoint {
  t: number;
  distance: number;
  pace: number | null;
  heartrate: number | null;
  elevation: number | null;
  cadence: number | null;
  watts: number | null;
}

export interface SegmentEffort {
  id: string;
  name: string;
  elapsedSeconds: number;
  isPr: boolean;
  leaderboardRank: number | null;
  leaderboardTotal: number | null;
}

export interface PremiumFields {
  relativeEffort: number | null;
  fitnessScore: number | null;
  freshnessScore: number | null;
  segmentEfforts: SegmentEffort[] | null;
  powerCurve: { duration: string; watts: number }[] | null;
}

export interface Activity {
  id: string;
  athleteId: string;
  name: string;
  type: ActivityType;
  startDate: string;
  distanceMeters: number;
  movingSeconds: number;
  elevationGainMeters: number;
  averageHeartrate: number | null;
  averagePace: number | null;
  averageWatts: number | null;
  premium: PremiumFields;
  streams: StreamPoint[];
}

export interface Athlete {
  id: string;
  name: string;
  isPremium: boolean;
}
