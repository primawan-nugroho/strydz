import { decodePolyline } from "@/lib/activities/polyline";

export default function RouteThumbnail({
  polyline,
  className,
}: {
  polyline: string;
  className?: string;
}) {
  const points = decodePolyline(polyline);
  if (points.length < 2) return null;

  const lats = points.map((p) => p[0]);
  const lngs = points.map((p) => p[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;
  const pad = 6;
  const size = 48;

  const path = points
    .map(([lat, lng], i) => {
      const x = pad + ((lng - minLng) / spanLng) * (size - pad * 2);
      const y = pad + (1 - (lat - minLat) / spanLat) * (size - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Route preview"
    >
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
