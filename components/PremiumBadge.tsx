export default function PremiumBadge({ source }: { source: "strava-premium" | "computed-fallback" }) {
  if (source === "strava-premium") {
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-bg text-accent-text">
        Strava premium
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-2 text-text-muted">
      Estimated
    </span>
  );
}
