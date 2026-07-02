import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </div>

      {/* Greeting */}
      <Skeleton className="h-8 w-48 mb-5" />

      {/* Fitness card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-16 w-full mt-2" />
      </div>

      {/* 2-col stat cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-surface-2 rounded-2xl p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-16 mb-1.5" />
          <Skeleton className="h-4 w-12" />
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-6 w-12 mb-1.5" />
          <Skeleton className="h-4 w-14" />
        </div>
      </div>

      {/* Weekly digest */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3 w-20 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>

      {/* Next training banner */}
      <Skeleton className="h-16 w-full rounded-2xl mb-4" />

      {/* Recent activity label */}
      <Skeleton className="h-3 w-28 mb-2" />

      {/* Activity rows */}
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-surface-2 rounded-2xl p-3 flex items-center gap-2.5 mb-2">
          <Skeleton className="w-[34px] h-[34px] rounded-[10px] shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-3.5 w-36 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
