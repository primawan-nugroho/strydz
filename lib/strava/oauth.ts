import type { StravaTokenResponse, TokenSet } from "./types";

const TOKEN_URL = "https://www.strava.com/oauth/token";
const AUTHORIZE_URL = "https://www.strava.com/oauth/authorize";

export function buildAuthorizeUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.STRAVA_CLIENT_ID!,
    redirect_uri: process.env.STRAVA_REDIRECT_URI!,
    response_type: "code",
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

function toTokenSet(data: StravaTokenResponse, fallbackAthleteId?: string): TokenSet {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAtSeconds: data.expires_at,
    athleteId: data.athlete?.id?.toString() ?? fallbackAthleteId ?? "",
  };
}

export async function exchangeCodeForToken(code: string): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token exchange failed: ${res.status}`);
  }
  const data = (await res.json()) as StravaTokenResponse;
  return toTokenSet(data);
}

export async function refreshAccessToken(refreshToken: string, fallbackAthleteId?: string): Promise<TokenSet> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Strava token refresh failed: ${res.status}`);
  }
  const data = (await res.json()) as StravaTokenResponse;
  return toTokenSet(data, fallbackAthleteId);
}

export function isExpiringSoon(tokenSet: TokenSet, bufferSeconds = 300): boolean {
  return Date.now() / 1000 > tokenSet.expiresAtSeconds - bufferSeconds;
}
