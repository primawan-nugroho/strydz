import type { WeeklyLoadPoint } from "@/lib/insights/types";

export default function WeeklyLoadBars({ data }: { data: WeeklyLoadPoint[] }) {
  const recent = data.slice(-7);
  const max = Math.max(...recent.map((d) => d.load), 1);

  return (
    <div className="flex gap-1 mt-3 h-7 items-end">
      {recent.map((d, i) => {
        const isLast = i === recent.length - 1;
        const heightPct = Math.max(15, Math.round((d.load / max) * 100));
        return (
          <div
            key={d.weekStart}
            className="flex-1 rounded-sm"
            style={{
              height: `${heightPct}%`,
              background: isLast ? "var(--accent)" : "var(--accent-bg)",
            }}
          />
        );
      })}
    </div>
  );
}
