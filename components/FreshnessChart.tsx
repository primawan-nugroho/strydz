"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, Tooltip } from "recharts";

export default function FreshnessChart({
  data,
}: {
  data: { date: string; value: number }[];
}) {
  return (
    <div style={{ width: "100%", height: 110 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Line type="monotone" dataKey="value" stroke="#534ab7" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
