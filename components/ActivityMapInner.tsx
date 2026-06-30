"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import type { StreamPoint } from "@/lib/activities/types";

type ColorMetric = "heartrate" | "pace";

function FitBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, bounds]);
  return null;
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number) {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const COOL: [number, number, number] = [24, 95, 165];
const HOT: [number, number, number] = [216, 90, 48];

export default function ActivityMapInner({
  streams,
  metric = "heartrate",
}: {
  streams: StreamPoint[];
  metric?: ColorMetric;
}) {
  const points = streams.filter((p) => p.latlng != null) as (StreamPoint & {
    latlng: [number, number];
  })[];
  if (points.length < 2) return null;

  const values = points
    .map((p) => (metric === "heartrate" ? p.heartrate : p.pace))
    .filter((v): v is number => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const positions: LatLngTuple[] = points.map((p) => p.latlng);
  const bounds: LatLngBoundsExpression = positions;

  return (
    <MapContainer
      center={positions[0]}
      zoom={14}
      scrollWheelZoom={false}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds bounds={bounds} />
      {points.slice(1).map((p, i) => {
        const prev = points[i];
        const raw = metric === "heartrate" ? p.heartrate : p.pace;
        const t = raw != null ? (raw - min) / range : 0;
        const color =
          metric === "pace" ? lerpColor(HOT, COOL, t) : lerpColor(COOL, HOT, t);
        return (
          <Polyline
            key={p.t}
            positions={[prev.latlng, p.latlng]}
            pathOptions={{ color, weight: 4, opacity: 0.9 }}
          />
        );
      })}
      <CircleMarker
        center={positions[0]}
        radius={6}
        pathOptions={{ color: "#3b6d11", fillColor: "#97c459", fillOpacity: 1, weight: 2 }}
      />
      <CircleMarker
        center={positions[positions.length - 1]}
        radius={6}
        pathOptions={{ color: "#791f1f", fillColor: "#e24b4a", fillOpacity: 1, weight: 2 }}
      />
    </MapContainer>
  );
}
