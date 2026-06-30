import Link from "next/link";
import { getActivities, getCurrentAthlete } from "@/lib/activities";
import { Footprints, Bike, Waves, ChevronRight } from "lucide-react";

const typeIcon = { Run: Footprints, Ride: Bike, Swim: Waves } as const;

function formatDistance(meters: number) {
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function ActivitiesPage() {
  const athlete = await getCurrentAthlete();
  const activities = await getActivities(athlete.id);

  return (
    <div>
      <h1 className="text-[18px] font-medium mb-4">Activities</h1>
      <div className="flex flex-col gap-2">
        {activities.map((activity) => {
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
                    {formatDate(activity.startDate)} · {formatDistance(activity.distanceMeters)} ·{" "}
                    {formatDuration(activity.movingSeconds)}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
