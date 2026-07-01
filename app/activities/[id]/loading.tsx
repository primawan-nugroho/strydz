import { Skeleton } from "@/components/Skeleton";

export default function ActivityDetailLoading() {
  return (
    <div>
      {/* Back link + title */}
      <Skeleton className="h-4 w-20 mb-4" />
      <Skeleton className="h-6 w-56 mb-1" />
      <Skeleton className="h-3 w-32 mb-4" />

      {/* Map placeholder */}
      <Skeleton className="w-full h-52 rounded-2xl mb-3" />

      {/* 3×2 stat grid */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface-2 rounded-2xl p-3">
            <Skeleton className="h-3 w-14 mb-2" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-36 w-full" />
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-surface-2 rounded-2xl p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-10 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="bg-surface-2 rounded-2xl p-3">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-6 w-10 mb-1.5" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Export button */}
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}
