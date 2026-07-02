import type { Activity } from "@/lib/activities/types";
import { buildFontStyle, FONT_FAMILY, type ExportFont } from "./fonts";

const PAD = 60;

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

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

const DEFAULT_FONT = "Arial, Helvetica, sans-serif";

/** Plain white text, no stroke/outline. Reads cleanly on dark or photo backgrounds; on a
 * light background it won't have contrast on its own since there's no outline or fill box. */
function plainText(
  x: number,
  y: number,
  content: string,
  fontSize: number,
  opts: {
    weight?: number;
    anchor?: "start" | "middle" | "end";
    opacity?: number;
    font?: string;
    letterSpacing?: number;
  } = {}
): string {
  const { weight = 400, anchor = "start", opacity = 1, font = DEFAULT_FONT, letterSpacing } = opts;
  const escaped = content.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
  const ls = letterSpacing != null ? ` letter-spacing="${letterSpacing}"` : "";
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" font-family="${font}" font-size="${fontSize}" font-weight="${weight}" fill="#ffffff" fill-opacity="${opacity}"${ls}>${escaped}</text>`;
}

/** Projects the activity's lat/lng stream into the given SVG bounds, preserving aspect
 * ratio, and returns the HR-gradient polyline + start/finish markers as SVG markup. */
function buildRouteSvg(activity: Activity, bounds: Bounds, strokeWidth = 10): string {
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
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round"/>`
    );
  }

  const markerR = Math.max(8, strokeWidth * 1.4);
  const [startX, startY] = toXY(...points[0].latlng);
  const [endX, endY] = toXY(...points[points.length - 1].latlng);

  return `
    ${segments.join("\n")}
    <circle cx="${startX.toFixed(1)}" cy="${startY.toFixed(1)}" r="${markerR}" fill="#97c459" stroke="white" stroke-width="4"/>
    <circle cx="${endX.toFixed(1)}" cy="${endY.toFixed(1)}" r="${markerR}" fill="#e24b4a" stroke="white" stroke-width="4"/>
  `;
}

function svgShell(w: number, h: number, fontStyle: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${fontStyle}
    ${body}
  </svg>`;
}

/** Layout 1 — "Split": route trace on the left, a 3x2 stat grid on the right at the same
 * height. The two stat rows are sized to their text and centered as one tight block rather
 * than stretched across the full column height. */
async function buildSplitLayout(activity: Activity): Promise<string> {
  const W = 1600;
  const H = 900;
  const MAP_W = 700;
  const GAP = 60;

  const contentTop = PAD;
  const contentH = H - PAD * 2;

  const mapBounds: Bounds = { x: PAD, y: contentTop, w: MAP_W, h: contentH };
  const statsBounds: Bounds = {
    x: PAD + MAP_W + GAP,
    y: contentTop,
    w: W - PAD - (PAD + MAP_W + GAP),
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

  return svgShell(W, H, "", `${buildRouteSvg(activity, mapBounds)}\n${grid}`);
}

/** Layout 2 — "Hero": a full-bleed route trace fills most of the card, with a single
 * understated row of stats along the bottom edge. Minimal, not cluttered. */
async function buildHeroLayout(activity: Activity): Promise<string> {
  const W = 1600;
  const H = 900;
  const mapBounds: Bounds = { x: PAD, y: PAD, w: W - PAD * 2, h: H - PAD * 2 - 150 };
  const statsY = mapBounds.y + mapBounds.h + 40;

  const stats = statList(activity);
  const cols = stats.length;
  const cellW = (W - PAD * 2) / cols;

  const row = stats
    .map(([label, value], i) => {
      const centerX = PAD + cellW * (i + 0.5);
      return `
        ${plainText(centerX, statsY, label, 24, { anchor: "middle", opacity: 0.65 })}
        ${plainText(centerX, statsY + 42, value, 40, { anchor: "middle", weight: 600 })}
      `;
    })
    .join("\n");

  return svgShell(W, H, "", `${buildRouteSvg(activity, mapBounds)}\n${row}`);
}

/** Layout 3 — "Poster": athletic-poster look in Bebas Neue. Route trace dominates; the
 * distance is set huge in condensed caps below it, remaining stats in one small-caps row. */
async function buildPosterLayout(activity: Activity): Promise<string> {
  const W = 1080;
  const H = 1350;
  const fontStyle = await buildFontStyle(["bebas"]);
  const bebas = FONT_FAMILY.bebas;

  const mapBounds: Bounds = { x: PAD, y: PAD, w: W - PAD * 2, h: H * 0.55 };

  const distance = (activity.distanceMeters / 1000).toFixed(2);
  const bigY = mapBounds.y + mapBounds.h + 200;

  const rest: [string, string][] = [
    [SPEED_BASED_TYPES.has(activity.type) ? "SPEED" : "PACE", formatPaceOrSpeed(activity.type, activity.averagePace)],
    ["TIME", formatDuration(activity.movingSeconds)],
    ["ELEV", `${activity.elevationGainMeters}M`],
    ["HR", activity.averageHeartrate != null ? `${Math.round(activity.averageHeartrate)}` : "—"],
  ];
  const rowY = bigY + 150;
  const cellW = (W - PAD * 2) / rest.length;
  const row = rest
    .map(([label, value], i) => {
      const centerX = PAD + cellW * (i + 0.5);
      return `
        ${plainText(centerX, rowY, label, 30, { anchor: "middle", opacity: 0.6, font: bebas, letterSpacing: 4 })}
        ${plainText(centerX, rowY + 62, value, 58, { anchor: "middle", font: bebas, letterSpacing: 2 })}
      `;
    })
    .join("\n");

  const body = `
    ${buildRouteSvg(activity, mapBounds, 12)}
    ${plainText(W / 2, bigY, `${distance} KM`, 220, { anchor: "middle", font: bebas, letterSpacing: 6 })}
    ${row}
  `;
  return svgShell(W, H, fontStyle, body);
}

/** Layout 4 — "Editorial": portrait magazine style. Playfair Display serif values under a
 * thin rule, Space Grotesk labels. Route trace fills the top two-thirds. */
async function buildEditorialLayout(activity: Activity): Promise<string> {
  const W = 1080;
  const H = 1350;
  const fontStyle = await buildFontStyle(["playfair", "grotesk"]);
  const playfair = FONT_FAMILY.playfair;
  const grotesk = FONT_FAMILY.grotesk;

  const mapBounds: Bounds = { x: PAD, y: PAD, w: W - PAD * 2, h: H * 0.62 };
  const ruleY = mapBounds.y + mapBounds.h + 70;

  const stats = statList(activity).slice(0, 4); // distance, pace, time, elev — keep it airy
  const cellW = (W - PAD * 2) / stats.length;
  const row = stats
    .map(([label, value], i) => {
      const centerX = PAD + cellW * (i + 0.5);
      return `
        ${plainText(centerX, ruleY + 60, label.toUpperCase(), 22, { anchor: "middle", opacity: 0.6, font: grotesk, letterSpacing: 3 })}
        ${plainText(centerX, ruleY + 135, value, 52, { anchor: "middle", font: playfair })}
      `;
    })
    .join("\n");

  const dateStr = formatDateShort(activity.startDate).toUpperCase();

  const body = `
    ${buildRouteSvg(activity, mapBounds, 9)}
    <line x1="${PAD}" y1="${ruleY}" x2="${W - PAD}" y2="${ruleY}" stroke="#ffffff" stroke-opacity="0.5" stroke-width="2"/>
    ${row}
    ${plainText(W / 2, H - PAD, dateStr, 24, { anchor: "middle", opacity: 0.5, font: grotesk, letterSpacing: 6 })}
  `;
  return svgShell(W, H, fontStyle, body);
}

/** Layout 5 — "Telemetry": terminal-style readout in JetBrains Mono on the left, route
 * trace on the right, subtle dot grid behind. */
async function buildTelemetryLayout(activity: Activity): Promise<string> {
  const W = 1600;
  const H = 900;
  const fontStyle = await buildFontStyle(["mono"]);
  const mono = FONT_FAMILY.mono;

  const mapBounds: Bounds = { x: W * 0.45, y: PAD, w: W * 0.55 - PAD, h: H - PAD * 2 };

  const isSpeed = SPEED_BASED_TYPES.has(activity.type);
  const rows: [string, string][] = [
    ["DIST", formatDistance(activity.distanceMeters).toUpperCase()],
    [isSpeed ? "SPD " : "PACE", formatPaceOrSpeed(activity.type, activity.averagePace).toUpperCase()],
    ["TIME", formatDuration(activity.movingSeconds)],
    ["ELEV", `${activity.elevationGainMeters} M`],
    ["HR  ", activity.averageHeartrate != null ? `${Math.round(activity.averageHeartrate)} BPM` : "—"],
    ["KCAL", activity.calories != null ? `${activity.calories}` : "—"],
  ];

  const lineH = 96;
  const blockH = rows.length * lineH;
  const startY = (H - blockH) / 2 + 48;
  const readout = rows
    .map(([label, value], i) => {
      const y = startY + i * lineH;
      return `
        ${plainText(PAD + 20, y, label, 34, { opacity: 0.55, font: mono })}
        ${plainText(PAD + 190, y, value, 52, { font: mono })}
      `;
    })
    .join("\n");

  // Subtle dot grid across the whole card
  const dots: string[] = [];
  for (let gx = PAD; gx <= W - PAD; gx += 60) {
    for (let gy = PAD; gy <= H - PAD; gy += 60) {
      dots.push(`<circle cx="${gx}" cy="${gy}" r="1.6" fill="#ffffff" fill-opacity="0.14"/>`);
    }
  }

  const body = `
    ${dots.join("")}
    ${readout}
    ${buildRouteSvg(activity, mapBounds, 10)}
  `;
  return svgShell(W, H, fontStyle, body);
}

/** Layout 6 — "Minimal": the route as art. Just the trace plus a tiny distance + date in
 * the bottom-left corner. */
async function buildMinimalLayout(activity: Activity): Promise<string> {
  const W = 1080;
  const H = 1080;
  const fontStyle = await buildFontStyle(["grotesk"]);
  const grotesk = FONT_FAMILY.grotesk;

  const mapBounds: Bounds = { x: PAD, y: PAD, w: W - PAD * 2, h: H - PAD * 2 - 60 };

  const caption = `${formatDistance(activity.distanceMeters)}  ·  ${formatDateShort(activity.startDate)}`;

  const body = `
    ${buildRouteSvg(activity, mapBounds, 11)}
    ${plainText(PAD, H - PAD + 10, caption, 30, { opacity: 0.75, font: grotesk, letterSpacing: 1 })}
  `;
  return svgShell(W, H, fontStyle, body);
}

export type ShareCardLayoutId = "split" | "hero" | "poster" | "editorial" | "telemetry" | "minimal";

export interface ShareCardLayout {
  id: ShareCardLayoutId;
  label: string;
  width: number;
  height: number;
  build: (a: Activity) => Promise<string>;
}

export const SHARE_CARD_LAYOUTS: ShareCardLayout[] = [
  { id: "split", label: "Map + grid", width: 1600, height: 900, build: buildSplitLayout },
  { id: "hero", label: "Full route", width: 1600, height: 900, build: buildHeroLayout },
  { id: "poster", label: "Poster", width: 1080, height: 1350, build: buildPosterLayout },
  { id: "editorial", label: "Editorial", width: 1080, height: 1350, build: buildEditorialLayout },
  { id: "telemetry", label: "Telemetry", width: 1600, height: 900, build: buildTelemetryLayout },
  { id: "minimal", label: "Minimal", width: 1080, height: 1080, build: buildMinimalLayout },
];

/** Builds a transparent-background share card. No map tiles are used for the route (only
 * the GPS trace) — that's what keeps the canvas untainted and the background transparent.
 * Custom fonts are embedded as base64 data URIs since the rasterizer can't load URLs. */
export async function buildShareCardSvg(
  activity: Activity,
  layoutId: ShareCardLayoutId = "split"
): Promise<{ svg: string; width: number; height: number }> {
  const layout = SHARE_CARD_LAYOUTS.find((l) => l.id === layoutId) ?? SHARE_CARD_LAYOUTS[0];
  return { svg: await layout.build(activity), width: layout.width, height: layout.height };
}

/** Rasterizes a share card layout to a transparent PNG. Browser-only (uses Image/canvas). */
export async function renderShareCardPng(
  activity: Activity,
  layoutId: ShareCardLayoutId = "split",
  scale = 2
): Promise<Blob> {
  const { svg, width, height } = await buildShareCardSvg(activity, layoutId);
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
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    ctx.drawImage(img, 0, 0, width * scale, height * scale);

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
