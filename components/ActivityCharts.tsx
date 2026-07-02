"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { StreamPoint } from "@/lib/activities/types";

function minutesLabel(seconds: number) {
  return `${Math.round(seconds / 60)}m`;
}

function formatPace(minPerKm: number) {
  const min = Math.floor(minPerKm);
  const sec = Math.round((minPerKm - min) * 60);
  return `${min}:${String(sec).padStart(2, "0")} /km`;
}

export default function ActivityCharts({ streams }: { streams: StreamPoint[] }) {
  const data = streams.map((p) => ({
    t: p.t,
    label: minutesLabel(p.t),
    pace: p.pace,
    heartrate: p.heartrate,
    elevation: p.elevation,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs text-text-muted mb-1">Heart rate (bpm)</p>
        <div style={{ width: "100%", height: 90 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin - 10", "dataMax + 10"]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(l) => `at ${l}`}
              />
              <Line type="monotone" dataKey="heartrate" stroke="#993c1d" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1">Pace (min/km)</p>
        <div style={{ width: "100%", height: 90 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide reversed domain={["dataMin - 0.5", "dataMax + 0.5"]} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                labelFormatter={(l) => `at ${l}`}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(v: any) => [formatPace(Number(v)), "pace"] as any}
              />
              <Line type="monotone" dataKey="pace" stroke="#185fa5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-xs text-text-muted mb-1">Elevation (m)</p>
        <div style={{ width: "100%", height: 90 }}>
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={[0, "dataMax + 10"]} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area
                type="monotone"
                dataKey="elevation"
                stroke="#3b6d11"
                fill="#c0dd97"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
