"use client";

import { useState } from "react";
import type { WeeklyLoadPoint } from "@/lib/insights/types";

function formatWeekLabel(weekStart: string): string {
  return new Date(weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function WeeklyLoadBars({ data }: { data: WeeklyLoadPoint[] }) {
  const recent = data.slice(-7);
  const max = Math.max(...recent.map((d) => d.load), 1);
  const avg = recent.length ? recent.reduce((sum, d) => sum + d.load, 0) / recent.length : 0;
  const [selected, setSelected] = useState<number | null>(null);

  const active = selected != null ? recent[selected] : null;
  const diffPercent = active && avg > 0 ? Math.round(((active.load - avg) / avg) * 100) : 0;

  return (
    <div>
      <div className="flex gap-1 mt-3 h-7 items-end">
        {recent.map((d, i) => {
          const isLast = i === recent.length - 1;
          const isSelected = selected === i;
          const heightPct = Math.max(15, Math.round((d.load / max) * 100));
          return (
            <button
              key={d.weekStart}
              type="button"
              aria-label={`Week of ${formatWeekLabel(d.weekStart)}: ${d.load} AU`}
              onClick={() => setSelected(isSelected ? null : i)}
              className="flex-1 h-full flex items-end p-0 border-0 bg-transparent appearance-none cursor-pointer"
            >
              <span
                className="w-full rounded-sm transition-opacity"
                style={{
                  height: `${heightPct}%`,
                  background: isLast ? "var(--accent)" : "var(--accent-bg)",
                  outline: isSelected ? "2px solid var(--accent-text)" : "none",
                  outlineOffset: 1,
                  opacity: selected != null && !isSelected ? 0.5 : 1,
                }}
              />
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-2 text-[11px] text-text-secondary">
          <span className="font-medium text-text-primary">Week of {formatWeekLabel(active.weekStart)}</span>
          {" — "}
          {active.load} AU
          {avg > 0 && (
            <span>
              {" · "}
              {diffPercent > 0 ? "+" : ""}
              {diffPercent}% {diffPercent >= 0 ? "above" : "below"} your average week
            </span>
          )}
        </div>
      )}
    </div>
  );
}
