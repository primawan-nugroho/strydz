import { Skeleton } from "@/components/Skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <Skeleton className="h-6 w-20 mb-4" />

      {/* Account card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3.5 w-16 mb-2" />
        <Skeleton className="h-3 w-48 mb-4" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>

      {/* Appearance card */}
      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <Skeleton className="h-3.5 w-24 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
      </div>

      {/* Install card */}
      <div className="bg-surface-2 rounded-2xl p-4">
        <Skeleton className="h-3.5 w-20 mb-4" />
        <Skeleton className="h-11 w-full rounded-full" />
      </div>
    </div>
  );
}
