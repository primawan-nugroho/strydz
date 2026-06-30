import Link from "next/link";
import { getActivities, getCurrentAthlete } from "@/lib/activities";
import {
  computeFitnessSummary,
  computeNextTraining,
  computeTrainingLoad,
} from "@/lib/insights";
import WeeklyLoadBars from "@/components/WeeklyLoadBars";
import { TrendingUp, TrendingDown, Route, ChevronRight, Footprints, Bike, Waves } from "lucide-react";

const typeIcon = { Run: Footprints, Ride: Bike, Swim: Waves } as const;

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const athlete = await getCurrentAthlete();
  const activities = await getActivities(athlete.id);
  const fitness = computeFitnessSummary(activities);
  const load = computeTrainingLoad(activities);
  const nextTraining = computeNextTraining(activities);
  const latest = activities[0];

  return (
    <div>
      <div className="flex items-center justify-between py-2 mb-4">
        <div>
          <p className="text-[13px] text-text-muted">Good morning</p>
          <p className="text-[16px] font-medium">{athlete.name}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-accent-bg flex items-center justify-center text-accent-text font-medium text-sm">
          {athlete.name.charAt(0)}
        </div>
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <p className="text-xs text-text-muted mb-1">Fitness level</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-medium">{fitness.level}</span>
          <span
            className={`text-[13px] flex items-center gap-1 ${
              fitness.trendPercent >= 0 ? "text-success-text" : "text-text-secondary"
            }`}
          >
            {fitness.trendPercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {fitness.trendPercent >= 0 ? "+" : ""}
            {fitness.trendPercent}% this week
          </span>
        </div>
        <WeeklyLoadBars data={load.weeklyLoad} />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-surface-2 rounded-2xl p-3">
          <p className="text-xs text-text-muted mb-1">Weekly load</p>
          <p className="text-xl font-medium">
            {load.acuteLoad7d} <span className="text-xs text-text-muted font-normal">AU</span>
          </p>
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <p className="text-xs text-text-muted mb-1">ACWR</p>
          <p
            className={`text-xl font-medium ${
              load.acwr > 1.5 ? "text-accent-text" : "text-success-text"
            }`}
          >
            {load.acwr}
          </p>
        </div>
      </div>

      <Link
        href="/insights"
        className="block bg-accent-bg rounded-2xl p-3.5 mb-4 flex items-center gap-3"
      >
        <Route size={22} className="text-accent-text shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-accent-text">Next up: {nextTraining.title}</p>
          <p className="text-xs text-accent-text">{nextTraining.detail}</p>
        </div>
      </Link>

      <p className="text-[13px] font-medium text-text-secondary mb-2">Recent activity</p>
      <div className="flex flex-col gap-2">
        {activities.slice(0, 4).map((activity) => {
          const Icon = typeIcon[activity.type];
          return (
            <Link
              key={activity.id}
              href={`/activities/${activity.id}`}
              className="bg-surface-2 rounded-2xl p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-[34px] h-[34px] rounded-[10px] bg-accent-bg flex items-center justify-center">
                  <Icon size={17} className="text-accent-text" />
                </div>
                <div>
                  <p className="text-[13px] font-medium">{activity.name}</p>
                  <p className="text-xs text-text-muted">
                    {formatDistance(activity.distanceMeters)} · {formatDuration(activity.movingSeconds)}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </Link>
          );
        })}
      </div>
      {latest && (
        <p className="mt-3 text-center">
          <Link href="/activities" className="text-xs text-text-secondary underline">
            View all activities
          </Link>
        </p>
      )}
    </div>
  );
}
