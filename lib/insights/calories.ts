/** Used when neither Strava nor the activity itself gives us a calorie figure. Strava's own
 * estimate factors in the athlete's actual weight; we don't have that from the basic athlete
 * scope, so this MET-based fallback uses an average adult body weight as a reasonable default. */
const DEFAULT_BODY_WEIGHT_KG = 70;

const MET_BY_TYPE: Record<string, number> = {
  Run: 9.8,
  Ride: 7.5,
  VirtualRide: 7.0,
  Swim: 6.0,
  Walk: 3.5,
  Hike: 6.0,
  WeightTraining: 5.0,
};

export function estimateCalories(type: string, movingSeconds: number): number {
  const met = MET_BY_TYPE[type] ?? 7.0;
  const hours = movingSeconds / 3600;
  return Math.round(met * DEFAULT_BODY_WEIGHT_KG * hours);
}
