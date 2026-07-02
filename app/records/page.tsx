import { getActivities, getCurrentAthlete } from "@/lib/activities";
import {
  computePersonalRecords,
  computeWeeklyVolumeTrend,
  computePaceEfficiencyTrend,
} from "@/lib/insights/records";
import SparklineChart from "@/components/SparklineChart";
import Link from "next/link";
import { Trophy, Ruler, Mountain, Flame, Zap, Clock, TrendingUp } from "lucide-react";

function fmtPace(minPerKm: number): string {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} /km`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface PrCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  activityId?: string;
  activityName?: string;
  activityDate?: string;
}

function PrCard({ icon, label, value, sub, activityId, activityName, activityDate }: PrCardProps) {
  return (
    <div className="pressable bg-surface-2 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent-text">{icon}</span>
        <p className="text-xs text-text-muted">{label}</p>
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      {activityId && (
        <Link
          href={`/activities/${activityId}`}
          className="mt-2 inline-block text-[11px] text-accent-text hover:underline"
        >
          {activityName} · {activityDate ? fmtDate(activityDate) : ""}
        </Link>
      )}
    </div>
  );
}

export default async function RecordsPage() {
  const athlete = await getCurrentAthlete();
  const activities = await getActivities(athlete.id);

  const prs = computePersonalRecords(activities);
  const volumeTrend = computeWeeklyVolumeTrend(activities, 12);
  const efficiencyTrend = computePaceEfficiencyTrend(activities, 10);

  const volumeData = volumeTrend.map((w) => ({
    label: w.weekStart.slice(5), // MM-DD
    value: w.distanceKm,
  }));

  // For efficiency, lower pacePerHr = more efficient; invert display so "up" = better
  const effData = efficiencyTrend.map((p) => ({
    label: p.date.slice(5),
    value: Number((1 / p.pacePerHr).toFixed(2)),
  }));

  const hasPrs =
    prs.longestRun ||
    prs.biggestClimb ||
    prs.bestPace5k ||
    prs.bestPace10k ||
    prs.highestRelativeEffort ||
    prs.mostCalories;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-accent-text" />
        <h1 className="text-[18px] font-medium">Records &amp; Trends</h1>
      </div>

      {!hasPrs && activities.length === 0 && (
        <div className="bg-surface-2 rounded-2xl p-6 text-center">
          <p className="text-sm text-text-muted">No activities yet. Connect Strava or run the demo data to see your records.</p>
        </div>
      )}

      {hasPrs && (
        <>
          <p className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">Personal records</p>
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {prs.bestPace5k && (
              <PrCard
                icon={<Zap size={14} />}
                label="Best 5K pace"
                value={fmtPace(prs.bestPace5k.paceMinPerKm)}
                activityId={prs.bestPace5k.activity.id}
                activityName={prs.bestPace5k.activity.name}
                activityDate={prs.bestPace5k.activity.startDate}
              />
            )}
            {prs.bestPace10k && (
              <PrCard
                icon={<Clock size={14} />}
                label="Best 10K pace"
                value={fmtPace(prs.bestPace10k.paceMinPerKm)}
                activityId={prs.bestPace10k.activity.id}
                activityName={prs.bestPace10k.activity.name}
                activityDate={prs.bestPace10k.activity.startDate}
              />
            )}
            {prs.longestRun && (
              <PrCard
                icon={<Ruler size={14} />}
                label="Longest run"
                value={`${prs.longestRun.distanceKm.toFixed(1)} km`}
                activityId={prs.longestRun.activity.id}
                activityName={prs.longestRun.activity.name}
                activityDate={prs.longestRun.activity.startDate}
              />
            )}
            {prs.biggestClimb && (
              <PrCard
                icon={<Mountain size={14} />}
                label="Biggest climb"
                value={`${Math.round(prs.biggestClimb.elevationM)} m`}
                activityId={prs.biggestClimb.activity.id}
                activityName={prs.biggestClimb.activity.name}
                activityDate={prs.biggestClimb.activity.startDate}
              />
            )}
            {prs.highestRelativeEffort && (
              <PrCard
                icon={<Flame size={14} />}
                label="Hardest effort"
                value={String(prs.highestRelativeEffort.value)}
                sub="Relative effort"
                activityId={prs.highestRelativeEffort.activity.id}
                activityName={prs.highestRelativeEffort.activity.name}
                activityDate={prs.highestRelativeEffort.activity.startDate}
              />
            )}
            {prs.mostCalories && (
              <PrCard
                icon={<Flame size={14} />}
                label="Most calories"
                value={`${prs.mostCalories.calories} kcal`}
                activityId={prs.mostCalories.activity.id}
                activityName={prs.mostCalories.activity.name}
                activityDate={prs.mostCalories.activity.startDate}
              />
            )}
          </div>
        </>
      )}

      <p className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">Trends</p>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <TrendingUp size={14} className="text-accent-text" />
          <p className="text-[13px] font-medium">Weekly volume</p>
        </div>
        <p className="text-xs text-text-muted">Distance per week (km) · last 12 weeks</p>
        {volumeData.length >= 2 ? (
          <SparklineChart data={volumeData} unit=" km" />
        ) : (
          <p className="text-[11px] text-text-muted mt-2">Not enough data yet.</p>
        )}
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <Zap size={14} className="text-accent-text" />
          <p className="text-[13px] font-medium">Aerobic efficiency</p>
        </div>
        <p className="text-xs text-text-muted">
          Speed-to-HR ratio trend · higher = more efficient
        </p>
        {effData.length >= 2 ? (
          <SparklineChart data={effData} unit="" color="var(--accent)" />
        ) : (
          <p className="text-[11px] text-text-muted mt-2">
            Need HR data on at least 2 activities.
          </p>
        )}
      </div>
    </div>
  );
}
