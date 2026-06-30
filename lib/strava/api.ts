import type { StravaActivity, StravaAthlete, StravaStreamSet } from "./types";

const BASE_URL = "https://www.strava.com/api/v3";

async function stravaFetch<T>(path: string, accessToken: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Strava API ${path} failed: ${res.status} ${body}`);
  }
  return res.json() as Promise<T>;
}

export function getAthlete(accessToken: string) {
  return stravaFetch<StravaAthlete>("/athlete", accessToken);
}

export function listActivities(accessToken: string, perPage = 20) {
  return stravaFetch<StravaActivity[]>(`/athlete/activities?per_page=${perPage}`, accessToken);
}

export function getActivityDetail(accessToken: string, id: string) {
  return stravaFetch<StravaActivity>(`/activities/${id}`, accessToken);
}

const STREAM_KEYS = "time,distance,latlng,altitude,heartrate,cadence,watts,velocity_smooth";

export function getActivityStreams(accessToken: string, id: string) {
  return stravaFetch<StravaStreamSet>(
    `/activities/${id}/streams?keys=${STREAM_KEYS}&key_by_type=true`,
    accessToken
  );
}
