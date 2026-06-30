export interface TokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAtSeconds: number;
  athleteId: string;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: { id: number };
}

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  premium?: boolean;
  summit?: boolean;
  /** "large"/"medium" profile photo URL, or the literal string "avatar/..." default when unset. */
  profile?: string;
  profile_medium?: string;
}

export interface StravaSegmentEffort {
  id: number;
  name: string;
  elapsed_time: number;
  pr_rank: number | null;
  kom_rank: number | null;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  start_date: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  average_heartrate?: number;
  average_speed: number;
  average_watts?: number;
  /** Kilocalories; only present on the detailed (single-activity) endpoint, and only when
   * Strava could derive it (requires HR or power data on the activity). */
  calories?: number;
  suffer_score?: number;
  segment_efforts?: StravaSegmentEffort[];
  map?: { summary_polyline?: string; polyline?: string };
}

export interface StravaStreamSet {
  time?: { data: number[] };
  distance?: { data: number[] };
  latlng?: { data: [number, number][] };
  altitude?: { data: number[] };
  heartrate?: { data: number[] };
  cadence?: { data: number[] };
  watts?: { data: number[] };
  velocity_smooth?: { data: number[] };
}
