export interface WeeklyLoadPoint {
  weekStart: string;
  load: number;
}

export interface TrainingLoadSummary {
  weeklyLoad: WeeklyLoadPoint[];
  acuteLoad7d: number;
  chronicLoad28d: number;
  acwr: number;
}

export type FitnessLevel = "Building" | "Maintaining" | "Peaking" | "Detraining";

export interface FitnessSummary {
  level: FitnessLevel;
  trendPercent: number;
}

export type WorkoutSuggestion = "rest" | "easy" | "tempo" | "long" | "interval";

export interface NextTraining {
  suggestion: WorkoutSuggestion;
  title: string;
  detail: string;
}

export interface HrZoneDistribution {
  zone: 1 | 2 | 3 | 4 | 5;
  label: string;
  percentTime: number;
}

export interface ActivityInsight {
  paceConsistencyPercent: number;
  elevationAdjustedEffort: number;
  hrZones: HrZoneDistribution[];
}

export interface RelativeEffortResult {
  value: number;
  source: "strava-premium" | "computed-fallback";
}

export interface EffortCurvePoint {
  duration: string;
  value: number;
}

export interface EffortCurveResult {
  points: EffortCurvePoint[];
  metric: "power" | "pace";
  source: "strava-premium" | "computed-fallback";
}

export interface SegmentPerformanceResult {
  available: boolean;
  efforts: { name: string; elapsedSeconds: number; isPr: boolean; rank: string }[];
}
