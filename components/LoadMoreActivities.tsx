"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import RouteThumbnail from "@/components/RouteThumbnail";
import type { Activity } from "@/lib/activities/types";

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

const PAGE_SIZE = 20;

export default function LoadMoreActivities({
  initialActivities,
}: {
  initialActivities: Activity[];
}) {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialActivities.length < PAGE_SIZE);

  async function loadMore() {
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/activities?page=${nextPage}`);
      const newItems: Activity[] = await res.json();
      setActivities((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      if (newItems.length < PAGE_SIZE) setExhausted(true);
    } catch {
      // silently ignore; the button stays visible so user can retry
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/activities/${activity.id}`}
            className="pressable bg-surface-2 rounded-2xl p-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-accent-bg flex items-center justify-center overflow-hidden">
                <RouteThumbnail polyline={activity.summaryPolyline} />
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
        ))}
      </div>

      {!exhausted && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="pressable w-full mt-3 flex items-center justify-center gap-2 rounded-full border border-border text-[13px] font-medium py-2.5 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Loading…
            </>
          ) : (
            "Load more"
          )}
        </button>
      )}

      {exhausted && activities.length > PAGE_SIZE && (
        <p className="text-center text-[11px] text-text-muted mt-3">
          All {activities.length} activities loaded.
        </p>
      )}
    </>
  );
}
