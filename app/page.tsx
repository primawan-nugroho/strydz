import Link from "next/link";
import { getDashboardData } from "@/lib/activities";
import {
  computeFitnessSummary,
  computeNextTraining,
  computeTrainingLoad,
} from "@/lib/insights";
import {
  describeFitnessLevel,
  rateAcwr,
  rateWeeklyLoad,
} from "@/lib/insights/benchmarks";
import WeeklyLoadBars from "@/components/WeeklyLoadBars";
import RouteThumbnail from "@/components/RouteThumbnail";
import Logo from "@/components/Logo";
import Greeting from "@/components/Greeting";
import Avatar from "@/components/Avatar";
import InfoTooltip from "@/components/InfoTooltip";
import RatingBadge from "@/components/RatingBadge";
import { TONE_TEXT } from "@/lib/insights/benchmarks";
import { Route, ChevronRight } from "lucide-react";

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const { athlete, activities, source } = await getDashboardData();
  const live = source === "live";
  const enoughData = activities.length >= 3;
  const fitness = computeFitnessSummary(activities);
  const load = computeTrainingLoad(activities);
  const nextTraining = computeNextTraining(activities);
  const acwrRating = rateAcwr(load.acwr);
  const loadRating = rateWeeklyLoad(load.acuteLoad7d, load.chronicLoad28d);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Logo size={26} className="text-accent" />
          <span className="text-[15px] font-medium tracking-wide">STRYDZ</span>
        </div>
        <Avatar name={athlete.name} src={athlete.profilePictureUrl} size={36} />
      </div>

      {!live && (
        <Link
          href="/settings"
          className="block bg-surface-2 rounded-xl px-3 py-2 mb-3 text-[11px] text-text-muted text-center"
        >
          Showing demo data — connect Strava in Settings
        </Link>
      )}

      <div className="py-1 mb-4">
        <Greeting name={athlete.name} />
      </div>

      {!enoughData && (
        <div className="bg-surface-2 rounded-2xl p-3.5 mb-3 text-[12px] text-text-secondary">
          Not enough activity history yet to compute reliable trends. Log a few more activities and
          your fitness, load, and ACWR will sharpen up.
        </div>
      )}

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-xs text-text-muted">Fitness level</p>
          <InfoTooltip label="Fitness level" text={describeFitnessLevel(fitness.level)} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-medium">{fitness.level}</span>
          <span
            className={`text-[13px] ${fitness.trendPercent >= 0 ? "text-success-text" : "text-text-secondary"}`}
          >
            {fitness.trendPercent >= 0 ? "+" : ""}
            {fitness.trendPercent}% this week
          </span>
        </div>
        <WeeklyLoadBars data={load.weeklyLoad} />
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-surface-2 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-text-muted">Weekly load</p>
            <InfoTooltip label="Weekly load (AU)" text={loadRating.description} />
          </div>
          <p className="text-xl font-medium">
            {load.acuteLoad7d} <span className="text-xs text-text-muted font-normal">AU</span>
          </p>
          <RatingBadge rating={loadRating} />
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-text-muted">ACWR</p>
            <InfoTooltip label="ACWR" text={acwrRating.description} />
          </div>
          <p className={`text-xl font-medium ${TONE_TEXT[acwrRating.tone]}`}>{load.acwr}</p>
          <RatingBadge rating={acwrRating} />
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
        {activities.slice(0, 4).map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="bg-surface-2 rounded-2xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-accent-bg flex items-center justify-center overflow-hidden">
                <RouteThumbnail polyline={activity.summaryPolyline} />
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
        ))}
      </div>
      {activities.length > 4 && (
        <p className="mt-3 text-center">
          <Link href="/activities" className="text-xs text-text-secondary underline">
            View all activities
          </Link>
        </p>
      )}
    </div>
  );
}
