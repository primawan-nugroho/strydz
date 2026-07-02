@AGENTS.md

# STRYDZ

Mobile-first web app that connects to a user's Strava account, visualizes a selected activity, and
generates training insights (fitness level, next training menu, etc.) from activity history.

Phase 1 builds the entire experience against local sample data so the UI/insights engine can be
demoed without a Strava account. Strava OAuth + live data is wired in afterward behind the same
data interface, so no UI code should change when the data source is swapped.

## Stack

- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS, mobile-first breakpoints (design for ~375–428px first, then scale up)
- **Charts**: Recharts for pace/HR/elevation visualizations
- **Icons**: lucide-react
- **Data fetching**: Next.js Route Handlers act as the backend boundary (token exchange, Strava
  proxy) — the frontend never talks to Strava directly
- **State**: server components + minimal client state; no global state library needed at this scale
- **Deployment target**: Vercel (Next.js-native, trivial OAuth callback URL handling)

## Data layer

- **Phase 1 (demo)**: static JSON fixtures under `data/sample/` modeling Strava's activity/stream
  shape (list of activities + per-activity time-series streams: pace, heart rate, elevation,
  cadence). A `lib/activities/` data-access module exposes `getActivities()` /
  `getActivityDetail(id)` reading from these fixtures.
- **Phase 2 (live) — built**: `lib/activities/index.ts` checks for a Strava session cookie; if
  present it calls `lib/strava/live.ts`, otherwise it falls back to the sample fixtures. Pages
  never branch on data source. Any live-fetch failure (expired token, missing scope, network)
  is caught and falls back to sample data rather than breaking the page.
- **OAuth**: `app/api/strava/{authorize,callback,disconnect,seed}` route handlers. Tokens stored in
  httpOnly cookies (`lib/strava/session.ts`); `proxy.ts` refreshes the access token ahead of
  expiry on every request (Route Handlers/Middleware can mutate cookies, Server Components can't —
  hence the split between `lib/strava/oauth.ts` — pure HTTP, Edge-safe — and `session.ts` — cookie
  I/O via `next/headers`).
- **Rate limits**: `lib/strava/cache.ts` is a process-memory TTL cache (60s activity lists, 5min
  detail/streams) fronting the live calls. Good enough for one dev server; a real deployment needs
  a shared store (Redis/KV) since this resets per instance/cold start.
- **Known public-API gap**: Strava's Fitness & Freshness graph and best-power curve are rendered in
  Strava's own app but are **not exposed by the public REST API for any account tier**. Live mode
  always returns `null` for `fitnessScore`/`freshnessScore`/`powerCurve`, which correctly resolves
  through `lib/insights`' computed-fallback path — this is the premium graceful-degradation design
  doing exactly what it was built for, just triggered by an API gap rather than a free account.
- **Strava API now requires a paid Strava subscription for the app owner.** Strava changed policy in
  2025 so a registered API application shows `Application Status: Inactive` (every call 403s,
  including `/athlete`) unless the developer account has an active Strava subscription. This is
  unrelated to OAuth scope or callback domain config — check `strava.com/settings/api` for a
  "subscriber-only" banner before debugging token/scope issues.
- No database. Tokens live in cookies only.

## AI coach

- `lib/coach/provider.ts` wraps a **provider-agnostic** OpenAI-compatible chat-completions call —
  `generateCoachText(systemPrompt, userPrompt, maxTokens)`. Configured via env vars: `AI_API_KEY`
  (required), `AI_API_BASE_URL` (default `https://api.groq.com/openai/v1`), `AI_MODEL` (default
  `llama-3.1-8b-instant`). Swapping providers (Mistral, Cerebras, OpenRouter, etc.) is a env-var-only
  change, no code change — any endpoint that speaks the OpenAI chat-completions shape works.
- **Do not default to Google Gemini.** Its free tier grants `limit: 0` quota (HTTP 429
  `RESOURCE_EXHAUSTED`) in some regions (observed: Indonesia) regardless of a valid API key — this
  is a silent regional gate, not a usage cap. Groq's free tier has no such restriction.
- Two endpoints: `app/api/coach/[id]/route.ts` (per-activity narrative, 24h cache per activity) and
  `app/api/coach-digest/route.ts` (weekly summary, 24h cache per athlete+ISO-week, shown on the
  dashboard via `WeeklyDigest`). Both fail closed — the client component hides itself on a 503
  (no key configured) and shows nothing on other errors rather than breaking the page.

## Insights engine

- Rule-based heuristics, computed client- or server-side from activity data — deterministic, no
  external API calls or cost.
- Lives in its own module (`lib/insights/`), decoupled from data-fetching and UI, so it works
  identically on sample data and real Strava data.
- Candidate metrics to start with:
  - **Fitness level / trend**: rolling training load (e.g. acute:chronic workload ratio over
    7d/28d), pace-per-HR efficiency trend across recent runs
  - **Next training menu**: suggest easy/tempo/long-run/rest based on recent load, days since last
    hard effort, and weekly volume trend
  - **Per-activity callouts**: pace consistency, elevation-adjusted effort, HR zone distribution
- Keep formulas simple and explainable first; revisit complexity only if heuristics prove
  insufficient against real data.

## Premium-tier features (Strava subscribers)

Strava's API doesn't expose a "this athlete has Premium" flag — premium-only fields are simply
present when the athlete is subscribed and absent/empty otherwise. STRYDZ treats this as a data
availability problem, not an account-tier flag:

- **Detection**: after fetching an activity/athlete payload, check whether the premium-only field
  is populated. No separate subscription check or auth scope needed.
- **Fallback strategy (graceful degradation)**: if a premium field is missing, either compute a
  basic equivalent from raw streams or omit that specific card — never block the rest of the
  dashboard, never show a paywall (we don't sell the upgrade, Strava does).
- Sample fixtures include both a "premium" athlete (all fields populated) and a "free" athlete
  (premium fields absent) so the fallback paths are exercised in the demo phase.

Premium-only insights:

- **Relative Effort**: Strava's HR-based effort rating per activity; fallback to our own
  TRIMP-style HR-zone effort calc when absent.
- **Fitness & Freshness (Form)**: long-running CTL/ATL/TSB-style fitness-vs-fatigue trend line;
  fallback to our rolling-load chart when premium data is absent.
- **Segment performance**: best efforts / segment leaderboard position and PRs on matched
  segments; omit entirely if segment-effort data isn't present.
- **Power curve / HR curve**: best-power (or best-HR) over standard durations; fallback to a simple
  pace-curve from GPS speed when power/HR streams are sparse.
- **Effort-trend comparisons**: trend of effort score across repeated efforts on the same
  route/segment over time.

These slot into `lib/insights/` as additional analyzers, each accepting the same activity/stream
shape and independently degrading — no separate "premium mode" branch in the UI layer.

## Structure

```
app/                      Next.js routes (App Router)
  page.tsx                dashboard
  activities/             activity list + [id] detail view
  insights/               insights/stats screen
  settings/               account / Strava connect + disconnect
  api/strava/             authorize, callback, disconnect, seed route handlers
components/               UI components (mobile-first), incl. BottomNav, charts, ActivityMap
lib/
  activities/             data-source switch (sample vs. live) + types
  insights/               rule-based analysis engine + types
  strava/                 OAuth, API client, response→Activity mapping, cache
proxy.ts                 refreshes near-expiry Strava access tokens before requests render
data/sample/              demo JSON fixtures (premium + free athlete)
scripts/                  generate-sample-data.mjs
```

## Roadmap / future enhancements

Ordered roughly by impact. Marked **[demo]** if intended for the sample-data phase, **[live]** if
it only makes sense once Strava data is connected.

1. ~~**Route map**~~ — done. react-leaflet + OSM detail map with HR gradient trace, plus inline-SVG
   `RouteThumbnail` (decoded from `summaryPolyline`, no map tiles) on list/dashboard rows.
2. ~~**Strava OAuth + live data**~~ — done. See Data layer above.
3. **Map-derived insights [live]** — auto-detected per-km/mile splits with fastest-split highlight;
   elevation profile synced to the map (hover → marker); grade-adjusted pace (GAP) per split.
4. **Chart ↔ map sync + metric toggle [live]** — hover a chart point to move the map marker;
   toggle the gradient trace between HR and pace. Deferred from the route-map pass.
5. **PR & trends page [live]** — best 5k/10k/half, longest run, biggest climb, with trend
   sparklines. Far more meaningful on real history than on ~16 fixture activities.
6. **Goals & training plan view** — forward-looking targets (e.g. "sub-50 10k", weekly mileage);
   gives "next training menu" a place to live as a multi-week plan.
7. **Activity comparison** — overlay pace/HR of two runs on the same route/distance; pairs with the
   premium effort-trend feature.
8. **UX polish** — skeleton loading states; activity-type filter tabs on the list; unit toggle
   (km/mi, pace/speed); pagination/infinite-scroll once activity counts grow past one page.
9. **PWA** — manifest + installability + pull-to-refresh, so it feels like a native mobile app.

### Architecture notes / open items

- **Shared cache store**: `lib/strava/cache.ts` is process-memory only — fine for one dev server,
  not for multiple serverless instances. Move to Redis/Vercel KV before any real deployment.
- **Token refresh on Edge**: `proxy.ts` does the refresh-and-persist dance because Server
  Components can read cookies but not write them. If middleware ever needs more Strava-aware logic,
  keep new code in `lib/strava/oauth.ts` (no `next/headers`) rather than `session.ts`.
- **Segment leaderboard rank/total**: the public API's `segment_efforts` gives `pr_rank`/`kom_rank`
  but not a full leaderboard position out of total athletes — `leaderboardRank`/`leaderboardTotal`
  are always `null` for live data. Revisit if a future endpoint exposes this.
- **OAuth scope**: requests `read,activity:read_all`. A token obtained from Strava's own "My API
  Application" page is often `read`-only and will 401 on `/athlete/activities` — this fails closed
  into the demo-data fallback rather than crashing, but isn't the same as a real connected account.

## Conventions

- Mobile-first: build and verify at small viewport widths before checking desktop.
- No backend/database until Strava OAuth (phase 2) requires server-side token storage.
- Insights logic must not depend on whether data came from fixtures or Strava — only depend on the
  shared `lib/activities` types.
