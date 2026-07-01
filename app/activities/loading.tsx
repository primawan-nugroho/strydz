import { Skeleton } from "@/components/Skeleton";

export default function ActivitiesLoading() {
  return (
    <div>
      <Skeleton className="h-6 w-24 mb-4" />
      <div className="flex flex-col gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-surface-2 rounded-2xl p-3 flex items-center gap-2.5">
            <Skeleton className="w-[34px] h-[34px] rounded-[10px] shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3.5 w-40 mb-1.5" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
