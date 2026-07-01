import { Skeleton } from "@/components/Skeleton";

export default function RecordsLoading() {
  return (
    <div>
      {/* Title */}
      <Skeleton className="h-6 w-44 mb-4" />

      {/* Section label */}
      <Skeleton className="h-3 w-32 mb-3" />

      {/* PR grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-surface-2 rounded-2xl p-4">
            <Skeleton className="h-3 w-20 mb-2" />
            <Skeleton className="h-7 w-28 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Trends label */}
      <Skeleton className="h-3 w-16 mb-3" />

      {/* Volume sparkline card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3.5 w-32 mb-1.5" />
        <Skeleton className="h-3 w-48 mb-3" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Efficiency sparkline card */}
      <div className="bg-surface-2 rounded-2xl p-4">
        <Skeleton className="h-3.5 w-36 mb-1.5" />
        <Skeleton className="h-3 w-52 mb-3" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );
}
