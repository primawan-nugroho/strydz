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
- **Phase 2 (live)**: same `lib/activities/` functions get a Strava-backed implementation behind
  the same signatures, so pages/components are unaffected. Strava tokens stored server-side
  (httpOnly cookie or session store), never exposed to the client.
- No database in phase 1. Revisit only if we need to persist tokens/history server-side for phase 2.

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
  settings/               account / Strava connect (phase 2)
  api/                    route handlers (Strava OAuth callback, token refresh — phase 2)
components/               UI components (mobile-first), incl. BottomNav, charts
lib/
  activities/             data-access layer (sample now, Strava later) + types
  insights/               rule-based analysis engine + types
data/sample/              demo JSON fixtures (premium + free athlete)
scripts/                  generate-sample-data.mjs
```

## Roadmap / future enhancements

Ordered roughly by impact. Marked **[demo]** if intended for the sample-data phase, **[live]** if
it only makes sense once Strava data is connected.

1. **Route map [demo]** — the biggest visible gap; Strava's signature visual.
   - Data: add `latlng` to `StreamPoint` and a `summaryPolyline` to `Activity`; generate plausible
     GPS loops in the sample fixtures.
   - Rendering: react-leaflet + OpenStreetMap tiles (free, no API key). MapLibre GL is the upgrade
     path. Static route thumbnail on list rows + dashboard; full interactive map on detail page.
   - Polyline colored by pace or HR (gradient trace) — premium-feeling, pure client-side.
   - Caveat: Leaflet needs explicit container height and dynamic import (`ssr: false`).
2. **Map-derived insights [demo]** — auto-detected per-km/mile splits with fastest-split highlight;
   elevation profile synced to the map (hover → marker); grade-adjusted pace (GAP) per split.
3. **PR & trends page [demo]** — best 5k/10k/half, longest run, biggest climb, with trend
   sparklines. Cheap to compute from existing data, high perceived value.
4. **Goals & training plan view [demo]** — forward-looking targets (e.g. "sub-50 10k", weekly
   mileage); gives "next training menu" a place to live as a multi-week plan.
5. **Activity comparison [demo]** — overlay pace/HR of two runs on the same route/distance; pairs
   with the premium effort-trend feature.
6. **UX polish [demo]** — skeleton loading states; empty state for the free athlete with no premium
   data; activity-type filter tabs (Run/Ride/Swim) on the list; unit toggle (km/mi, pace/speed).
7. **PWA [demo]** — manifest + installability + pull-to-refresh, so it feels like a native mobile
   app (matters given the mobile-first goal).

### Architecture notes to decide before Strava integration

- **Rate limits [live]**: Strava API caps (~100 req/15min, 1000/day). Design a cache layer into the
  data interface now so it slots in cleanly later.
- **Map data size**: full `latlng` streams are large. Decide whether the data layer returns
  decimated streams for list thumbnails vs. full resolution for the detail map.

## Conventions

- Mobile-first: build and verify at small viewport widths before checking desktop.
- No backend/database until Strava OAuth (phase 2) requires server-side token storage.
- Insights logic must not depend on whether data came from fixtures or Strava — only depend on the
  shared `lib/activities` types.
