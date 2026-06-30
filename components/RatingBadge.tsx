import { TONE_BG, TONE_TEXT, type Rating } from "@/lib/insights/benchmarks";

export default function RatingBadge({ rating }: { rating: Rating }) {
  return (
    <span
      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${TONE_BG[rating.tone]} ${TONE_TEXT[rating.tone]}`}
    >
      {rating.band}
    </span>
  );
}
