/** Strava reports many sport_type values (Hike, Walk, WeightTraining, ...); we don't
 * restrict to a literal union since real accounts will produce types beyond our fixtures. */
export type ActivityType = string;

export interface StreamPoint {
  t: number;
  distance: number;
  pace: number | null;
  heartrate: number | null;
  elevation: number | null;
  cadence: number | null;
  watts: number | null;
  latlng: [number, number] | null;
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
  /** Kilocalories. From Strava's `calories` field when present; otherwise a MET-based
   * estimate (lib/insights/calories.ts) — see Activity detail card for the distinction. */
  calories: number | null;
  caloriesEstimated: boolean;
  premium: PremiumFields;
  streams: StreamPoint[];
  /** Encoded polyline (Google polyline algorithm, precision 5) of a decimated route — mirrors
   * Strava's summary_polyline, which is the only geo data available on list endpoints. */
  summaryPolyline: string;
}

export interface Athlete {
  id: string;
  name: string;
  isPremium: boolean;
  profilePictureUrl: string | null;
}
