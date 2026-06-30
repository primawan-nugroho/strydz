"use client";

import dynamic from "next/dynamic";
import type { StreamPoint } from "@/lib/activities/types";

const ActivityMapInner = dynamic(() => import("./ActivityMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-xs text-text-muted">
      Loading map…
    </div>
  ),
});

export default function ActivityMap({
  streams,
  metric,
}: {
  streams: StreamPoint[];
  metric?: "heartrate" | "pace";
}) {
  return <ActivityMapInner streams={streams} metric={metric} />;
}
