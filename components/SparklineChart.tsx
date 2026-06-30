"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

interface SparklineProps {
  data: { label: string; value: number }[];
  color?: string;
  /** If true, lower values are better (e.g. pace efficiency) */
  invertGood?: boolean;
  unit?: string;
  refLine?: number;
}

export default function SparklineChart({
  data,
  color = "var(--accent)",
  unit = "",
  refLine,
}: SparklineProps) {
  if (data.length < 2) {
    return (
      <p className="text-[11px] text-text-muted mt-2">Not enough data to show a trend.</p>
    );
  }

  return (
    <div className="w-full h-20 mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -32 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide domain={["auto", "auto"]} />
          {refLine !== undefined && (
            <ReferenceLine y={refLine} stroke="var(--border)" strokeDasharray="3 3" />
          )}
          <Tooltip
            contentStyle={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 11,
              padding: "4px 8px",
            }}
            labelStyle={{ color: "var(--text-muted)", marginBottom: 2 }}
            itemStyle={{ color: "var(--text-primary)" }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => [`${v}${unit}`, ""] as any}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 2, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
