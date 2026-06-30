import { getActivities, getCurrentAthlete } from "@/lib/activities";
import {
  computeFitnessSummary,
  computeNextTraining,
  computeTrainingLoad,
  getFitnessFreshnessTrend,
} from "@/lib/insights";
import {
  describeFitnessLevel,
  rateAcwr,
  rateWeeklyLoad,
} from "@/lib/insights/benchmarks";
import WeeklyLoadBars from "@/components/WeeklyLoadBars";
import FreshnessChart from "@/components/FreshnessChart";
import PremiumBadge from "@/components/PremiumBadge";
import InfoTooltip from "@/components/InfoTooltip";
import RatingBadge from "@/components/RatingBadge";
import RatingScale from "@/components/RatingScale";
import { Zap, Moon, Flame, Mountain } from "lucide-react";

const suggestionIcon = { rest: Moon, easy: Zap, tempo: Flame, long: Mountain, interval: Flame } as const;

const CHRONIC_INFO =
  "Chronic load (28d) is your rolling 4-week average weekly training stress — it represents your established fitness baseline. Acute load is judged against it.";

export default async function InsightsPage() {
  const athlete = await getCurrentAthlete();
  const activities = await getActivities(athlete.id);
  const fitness = computeFitnessSummary(activities);
  const load = computeTrainingLoad(activities);
  const nextTraining = computeNextTraining(activities);
  const freshness = getFitnessFreshnessTrend(activities);
  const acwrRating = rateAcwr(load.acwr);
  const loadRating = rateWeeklyLoad(load.acuteLoad7d, load.chronicLoad28d);

  const SuggestionIcon = suggestionIcon[nextTraining.suggestion];

  return (
    <div>
      <h1 className="text-[18px] font-medium mb-4">Insights</h1>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-xs text-text-muted">Fitness level</p>
          <InfoTooltip label="Fitness level" text={describeFitnessLevel(fitness.level)} />
        </div>
        <p className="text-2xl font-medium mb-1">{fitness.level}</p>
        <p className="text-xs text-text-secondary">
          {fitness.trendPercent >= 0 ? "+" : ""}
          {fitness.trendPercent}% vs last week · ACWR {load.acwr}
        </p>
        <WeeklyLoadBars data={load.weeklyLoad} />
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-medium">ACWR</p>
            <InfoTooltip label="ACWR" text={acwrRating.description} />
          </div>
          <RatingBadge rating={acwrRating} />
        </div>
        <p className="text-2xl font-medium">{load.acwr}</p>
        <RatingScale rating={acwrRating} />
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-bg flex items-center justify-center shrink-0">
          <SuggestionIcon size={18} className="text-accent-text" />
        </div>
        <div>
          <p className="text-[13px] font-medium">{nextTraining.title}</p>
          <p className="text-xs text-text-secondary">{nextTraining.detail}</p>
        </div>
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[13px] font-medium">Fitness and freshness</p>
          <PremiumBadge source={freshness.source} />
        </div>
        <p className="text-xs text-text-muted mb-1">
          {freshness.source === "strava-premium"
            ? "Strava's long-running fitness vs fatigue trend"
            : "Estimated from rolling weekly training load"}
        </p>
        <FreshnessChart data={freshness.points} />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface-2 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-text-muted">Acute load (7d)</p>
            <InfoTooltip label="Acute load (7d)" text={loadRating.description} />
          </div>
          <p className="text-lg font-medium">{load.acuteLoad7d}</p>
          <RatingBadge rating={loadRating} />
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <p className="text-xs text-text-muted">Chronic load (28d)</p>
            <InfoTooltip label="Chronic load (28d)" text={CHRONIC_INFO} />
          </div>
          <p className="text-lg font-medium">{load.chronicLoad28d}</p>
        </div>
      </div>
    </div>
  );
}
