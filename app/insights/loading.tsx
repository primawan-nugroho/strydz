import { Skeleton } from "@/components/Skeleton";

export default function InsightsLoading() {
  return (
    <div>
      <Skeleton className="h-6 w-20 mb-4" />

      {/* Fitness level card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-3 w-40 mb-3" />
        <Skeleton className="h-16 w-full" />
      </div>

      {/* ACWR card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3 w-12 mb-2" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Next training card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3 flex items-start gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-3.5 w-32 mb-2" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>

      {/* Freshness chart card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3 w-36 mb-2" />
        <Skeleton className="h-3 w-48 mb-3" />
        <Skeleton className="h-32 w-full" />
      </div>

      {/* Load stats */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-surface-2 rounded-2xl p-3">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-6 w-14 mb-1.5" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <Skeleton className="h-3 w-28 mb-2" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    </div>
  );
}
