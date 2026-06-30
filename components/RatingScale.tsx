import { TONE_FILL, type Rating } from "@/lib/insights/benchmarks";

/** Low/med/high strip with segment labels and a marker at the current value's position. */
export default function RatingScale({ rating }: { rating: Rating }) {
  const n = rating.scale.length;
  return (
    <div className="mt-2">
      <div className="relative h-1.5 rounded-full overflow-hidden flex">
        {rating.scale.map((seg, i) => (
          <div key={i} className="flex-1" style={{ background: TONE_FILL[seg.tone], opacity: 0.4 }} />
        ))}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border-2 border-surface-1"
          style={{ left: `${rating.position * 100}%`, background: TONE_FILL[rating.tone] }}
        />
      </div>
      <div className="flex mt-1">
        {rating.scale.map((seg, i) => (
          <span
            key={i}
            className="flex-1 text-[9px] text-text-muted text-center"
            style={{ textAlign: i === 0 ? "left" : i === n - 1 ? "right" : "center" }}
          >
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
