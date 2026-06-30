import type { Activity } from "@/lib/activities/types";

const WIDTH = 1600;
const HEIGHT = 900;
const PAD = 60;
const GAP = 60;
const MAP_W = 700;

const SPEED_BASED_TYPES = new Set(["Ride", "VirtualRide", "EBikeRide", "Swim"]);

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  return h > 0
    ? `${h}:${String(m % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
    : `${m}:${String(seconds % 60).padStart(2, "0")}`;
}

function formatPaceOrSpeed(type: string, paceMinPerKm: number | null): string {
  if (paceMinPerKm == null || paceMinPerKm <= 0) return "—";
  if (SPEED_BASED_TYPES.has(type)) return `${(60 / paceMinPerKm).toFixed(1)} km/h`;
  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);
  return `${minutes}:${String(seconds).padStart(2, "0")} /km`;
}

function statList(activity: Activity): [string, string][] {
  const isSpeedType = SPEED_BASED_TYPES.has(activity.type);
  return [
    ["Distance", formatDistance(activity.distanceMeters)],
    [isSpeedType ? "Avg speed" : "Avg pace", formatPaceOrSpeed(activity.type, activity.averagePace)],
    ["Time", formatDuration(activity.movingSeconds)],
    ["Elev gain", `${activity.elevationGainMeters} m`],
    ["Avg HR", activity.averageHeartrate != null ? `${Math.round(activity.averageHeartrate)} bpm` : "—"],
    ["Calories", activity.calories != null ? `${activity.calories} kcal` : "—"],
  ];
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

const COOL: [number, number, number] = [56, 138, 221];
const HOT: [number, number, number] = [216, 90, 48];

/** Plain white text, no stroke/outline. Reads cleanly on dark or photo backgrounds; on a
 * light background it won't have contrast on its own since there's no outline or fill box. */
function plainText(
  x: number,
  y: number,
  content: string,
  fontSize: number,
  opts: { weight?: number; anchor?: "start" | "middle" | "end"; opacity?: number } = {}
): string {
  const { weight = 400, anchor = "start", opacity = 1 } = opts;
  const escaped = content.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="#ffffff" fill-opacity="${opacity}">${escaped}</text>`;
}

/** Projects the activity's lat/lng stream into the given SVG bounds, preserving aspect
 * ratio, and returns the HR-gradient polyline + start/finish markers as SVG markup. */
function buildRouteSvg(activity: Activity, bounds: Bounds): string {
  const points = activity.streams.filter((p) => p.latlng != null) as (Activity["streams"][number] & {
    latlng: [number, number];
  })[];
  if (points.length < 2) return "";

  const lats = points.map((p) => p.latlng[0]);
  const lngs = points.map((p) => p.latlng[1]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = maxLat - minLat || 1;
  const spanLng = maxLng - minLng || 1;

  const scale = Math.min(bounds.w / spanLng, bounds.h / spanLat) * 0.9;
  const offsetX = bounds.x + (bounds.w - spanLng * scale) / 2;
  const offsetY = bounds.y + (bounds.h - spanLat * scale) / 2;

  const toXY = (lat: number, lng: number) => [
    offsetX + (lng - minLng) * scale,
    offsetY + (maxLat - lat) * scale,
  ];

  const hrValues = points.map((p) => p.heartrate).filter((h): h is number => h != null);
  const minHr = hrValues.length ? Math.min(...hrValues) : 0;
  const maxHr = hrValues.length ? Math.max(...hrValues) : 1;
  const hrRange = maxHr - minHr || 1;

  const segments: string[] = [];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = toXY(...points[i - 1].latlng);
    const [x2, y2] = toXY(...points[i].latlng);
    const hr = points[i].heartrate;
    const t = hr != null ? (hr - minHr) / hrRange : 0.5;
    const color = lerpColor(COOL, HOT, t);
    segments.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="10" stroke-linecap="round"/>`
    );
  }

  const [startX, startY] = toXY(...points[0].latlng);
  const [endX, endY] = toXY(...points[points.length - 1].latlng);

  return `
    ${segments.join("\n")}
    <circle cx="${startX.toFixed(1)}" cy="${startY.toFixed(1)}" r="14" fill="#97c459" stroke="white" stroke-width="4"/>
    <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="14" fill="#e24b4a" stroke="white" stroke-width="4"/>
  `;
}

/** Layout 1 — "Split": route trace on the left, a 3x2 stat grid on the right at the same
 * height. The two stat rows are sized to their text and centered as one tight block rather
 * than stretched across the full column height. */
function buildSplitLayout(activity: Activity): string {
  const contentTop = PAD;
  const contentBottom = HEIGHT - PAD;
  const contentH = contentBottom - contentTop;

  const mapBounds: Bounds = { x: PAD, y: contentTop, w: MAP_W, h: contentH };
  const statsBounds: Bounds = {
    x: PAD + MAP_W + GAP,
    y: contentTop,
    w: WIDTH - PAD - (PAD + MAP_W + GAP),
    h: contentH,
  };

  const stats = statList(activity);
  const cols = 3;
  const rows = 2;
  const cellW = statsBounds.w / cols;
  const rowH = 220;
  const gridH = rowH * rows;
  const gridStartY = statsBounds.y + (statsBounds.h - gridH) / 2;

  const grid = stats
    .map(([label, value], i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const centerX = statsBounds.x + cellW * (col + 0.5);
      const centerY = gridStartY + rowH * (row + 0.5);
      return `
        ${plainText(centerX, centerY - 18, label, 32, { anchor: "middle", opacity: 0.75 })}
        ${plainText(centerX, centerY + 46, value, 56, { anchor: "middle", weight: 600 })}
      `;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    ${buildRouteSvg(activity, mapBounds)}
    ${grid}
  </svg>`;
}

/** Layout 2 — "Hero": a full-bleed route trace fills most of the card, with a single
 * understated row of stats along the bottom edge. Minimal, not cluttered. */
function buildHeroLayout(activity: Activity): string {
  const mapBounds: Bounds = { x: PAD, y: PAD, w: WIDTH - PAD * 2, h: HEIGHT - PAD * 2 - 150 };
  const statsY = mapBounds.y + mapBounds.h + 40;

  const stats = statList(activity);
  const cols = stats.length;
  const cellW = (WIDTH - PAD * 2) / cols;

  const row = stats
    .map(([label, value], i) => {
      const centerX = PAD + cellW * (i + 0.5);
      return `
        ${plainText(centerX, statsY, label, 24, { anchor: "middle", opacity: 0.65 })}
        ${plainText(centerX, statsY + 42, value, 40, { anchor: "middle", weight: 600 })}
      `;
    })
    .join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    ${buildRouteSvg(activity, mapBounds)}
    ${row}
  </svg>`;
}

export type ShareCardLayoutId = "split" | "hero";

export const SHARE_CARD_LAYOUTS: { id: ShareCardLayoutId; label: string; build: (a: Activity) => string }[] = [
  { id: "split", label: "Map + grid", build: buildSplitLayout },
  { id: "hero", label: "Full route", build: buildHeroLayout },
];

/** Builds a transparent-background share card. No map tiles are used for the route (only
 * the GPS trace) — that's what keeps the canvas untainted and the background transparent. */
export function buildShareCardSvg(activity: Activity, layoutId: ShareCardLayoutId = "split"): string {
  const layout = SHARE_CARD_LAYOUTS.find((l) => l.id === layoutId) ?? SHARE_CARD_LAYOUTS[0];
  return layout.build(activity);
}

/** Rasterizes a share card layout to a transparent PNG. Browser-only (uses Image/canvas). */
export async function renderShareCardPng(
  activity: Activity,
  layoutId: ShareCardLayoutId = "split",
  scale = 2
): Promise<Blob> {
  const svg = buildShareCardSvg(activity, layoutId);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
    if ("decode" in img) {
      await img.decode().catch(() => {});
    }

    const canvas = document.createElement("canvas");
    canvas.width = WIDTH * scale;
    canvas.height = HEIGHT * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0, WIDTH * scale, HEIGHT * scale);

    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!pngBlob) throw new Error("PNG export failed");
    return pngBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
