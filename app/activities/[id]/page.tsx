import Link from "next/link";
import { notFound } from "next/navigation";
import { getActivityDetail } from "@/lib/activities";
import {
  computeActivityInsight,
  getEffortCurve,
  getRelativeEffort,
  getSegmentPerformance,
} from "@/lib/insights";
import ActivityCharts from "@/components/ActivityCharts";
import PremiumBadge from "@/components/PremiumBadge";
import { ArrowLeft, Trophy } from "lucide-react";

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const activity = await getActivityDetail(id);
  if (!activity) notFound();

  const insight = computeActivityInsight(activity);
  const relativeEffort = getRelativeEffort(activity);
  const effortCurve = getEffortCurve(activity);
  const segments = getSegmentPerformance(activity);

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-text-secondary mb-3">
        <ArrowLeft size={16} /> Back
      </Link>

      <h1 className="text-[19px] font-medium">{activity.name}</h1>
      <p className="text-xs text-text-muted mb-4">{formatDate(activity.startDate)}</p>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="bg-surface-2 rounded-2xl p-3">
          <p className="text-[11px] text-text-muted mb-1">Distance</p>
          <p className="text-[15px] font-medium">{formatDistance(activity.distanceMeters)}</p>
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <p className="text-[11px] text-text-muted mb-1">Time</p>
          <p className="text-[15px] font-medium">{formatDuration(activity.movingSeconds)}</p>
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <p className="text-[11px] text-text-muted mb-1">Elev gain</p>
          <p className="text-[15px] font-medium">{activity.elevationGainMeters} m</p>
        </div>
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-4">
        <ActivityCharts streams={activity.streams} />
      </div>

      <p className="text-[13px] font-medium text-text-secondary mb-2">Insights</p>
      <div className="flex flex-col gap-2.5 mb-4">
        <div className="bg-surface-2 rounded-2xl p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium">Relative effort</p>
            <p className="text-xs text-text-muted">HR-based effort score for this activity</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium">{relativeEffort.value}</span>
            <PremiumBadge source={relativeEffort.source} />
          </div>
        </div>

        <div className="bg-surface-2 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-medium">
              {effortCurve.metric === "power" ? "Power curve" : "Pace curve"}
            </p>
            <PremiumBadge source={effortCurve.source} />
          </div>
          <div className="flex justify-between">
            {effortCurve.points.map((p) => (
              <div key={p.duration} className="text-center">
                <p className="text-[15px] font-medium">
                  {p.value}
                  <span className="text-[11px] text-text-muted">
                    {effortCurve.metric === "power" ? "w" : "/km"}
                  </span>
                </p>
                <p className="text-[11px] text-text-muted">{p.duration}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-2 rounded-2xl p-3.5">
          <p className="text-[13px] font-medium mb-2">Pace consistency</p>
          <div className="h-1.5 rounded-full bg-surface-1 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${insight.paceConsistencyPercent}%`, background: "var(--accent)" }}
            />
          </div>
          <p className="text-xs text-text-muted mt-1.5">{insight.paceConsistencyPercent}% consistent pacing</p>
        </div>

        <div className="bg-surface-2 rounded-2xl p-3.5">
          <p className="text-[13px] font-medium mb-2.5">Heart rate zones</p>
          <div className="flex flex-col gap-1.5">
            {insight.hrZones.map((z) => (
              <div key={z.zone} className="flex items-center gap-2">
                <span className="text-[11px] text-text-muted w-16 shrink-0">{z.label}</span>
                <div className="flex-1 h-2 rounded-full bg-surface-1 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${z.percentTime}%` }}
                  />
                </div>
                <span className="text-[11px] text-text-muted w-8 text-right">{z.percentTime}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-2 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-medium">Segment performance</p>
            {segments.available && <PremiumBadge source="strava-premium" />}
          </div>
          {segments.available ? (
            <div className="flex flex-col gap-2">
              {segments.efforts.map((e) => (
                <div key={e.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {e.isPr && <Trophy size={14} className="text-accent-text" />}
                    <span className="text-[13px]">{e.name}</span>
                  </div>
                  <span className="text-xs text-text-muted">
                    {e.elapsedSeconds}s · #{e.rank}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-muted">
              Requires Strava premium segment data — not available for this activity.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
