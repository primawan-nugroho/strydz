import { writeFileSync, mkdirSync } from "fs";

mkdirSync("data/sample", { recursive: true });

const JAKARTA_CENTER = [-6.2088, 106.8456];
const METERS_PER_DEGREE_LAT = 111320;

function hashSeed(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

/** Generates a closed-loop route whose perimeter roughly matches distanceMeters. */
function routeLatLngs(distanceMeters, seed, pointsCount) {
  const rand = (n) => ((seed >> n) % 100) / 100;
  const centerLatOffset = (rand(0) - 0.5) * 0.04;
  const centerLngOffset = (rand(4) - 0.5) * 0.04;
  const rotation = rand(8) * Math.PI * 2;
  const aspect = 0.55 + rand(12) * 0.5;
  const lobes = 1 + Math.floor(rand(16) * 2);

  const radiusDeg = distanceMeters / (2 * Math.PI) / METERS_PER_DEGREE_LAT;
  const centerLat = JAKARTA_CENTER[0] + centerLatOffset;
  const centerLng = JAKARTA_CENTER[1] + centerLngOffset;
  const lngScale = 1 / Math.cos((centerLat * Math.PI) / 180);

  const points = [];
  for (let i = 0; i < pointsCount; i++) {
    const frac = i / (pointsCount - 1);
    const angle = frac * Math.PI * 2;
    const wobble = 1 + 0.08 * Math.sin(angle * lobes * 2);
    const x = Math.cos(angle) * radiusDeg * wobble;
    const y = Math.sin(angle) * radiusDeg * aspect * wobble;
    const rx = x * Math.cos(rotation) - y * Math.sin(rotation);
    const ry = x * Math.sin(rotation) + y * Math.cos(rotation);
    const lat = centerLat + ry;
    const lng = centerLng + rx * lngScale;
    points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
  }
  return points;
}

/** Encodes [lat, lng] pairs using the Google polyline algorithm (precision 5). */
function encodePolyline(points) {
  let lastLat = 0;
  let lastLng = 0;
  let result = "";

  for (const [lat, lng] of points) {
    const latE5 = Math.round(lat * 1e5);
    const lngE5 = Math.round(lng * 1e5);
    result += encodeValue(latE5 - lastLat);
    result += encodeValue(lngE5 - lastLng);
    lastLat = latE5;
    lastLng = lngE5;
  }
  return result;
}

function encodeValue(value) {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let result = "";
  while (v >= 0x20) {
    result += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  result += String.fromCharCode(v + 63);
  return result;
}

function streamFor(distanceMeters, movingSeconds, basePace, baseHr, hilly, hasPower, seed) {
  const points = 24;
  const route = routeLatLngs(distanceMeters, seed, points);
  const stream = [];
  for (let i = 0; i < points; i++) {
    const frac = i / (points - 1);
    const wobble = Math.sin(frac * Math.PI * 4) * 0.06;
    const fatigue = frac * 0.04;
    const pace = basePace * (1 - wobble + fatigue);
    const hr = Math.round(baseHr * (0.85 + frac * 0.2 + wobble * 0.3));
    const elevation = hilly
      ? Math.round(20 + 40 * Math.sin(frac * Math.PI * 2) + frac * 10)
      : Math.round(5 + frac * 3);
    stream.push({
      t: Math.round(frac * movingSeconds),
      distance: Math.round(frac * distanceMeters),
      pace: Number(pace.toFixed(2)),
      heartrate: hr,
      elevation,
      cadence: Math.round(82 + Math.sin(frac * Math.PI * 6) * 3),
      watts: hasPower ? Math.round(180 + Math.sin(frac * Math.PI * 3) * 25 + frac * 10) : null,
      latlng: route[i],
    });
  }
  return stream;
}

function makeActivity({ id, athleteId, name, type, daysAgo, distanceKm, paceMinPerKm, avgHr, elevGain, hard, premium, hasPower }) {
  const distanceMeters = Math.round(distanceKm * 1000);
  const movingSeconds = Math.round(distanceKm * paceMinPerKm * 60);
  const startDate = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const seed = hashSeed(id);

  const premiumFields = premium
    ? {
        relativeEffort: Math.round(40 + hard * 60 + Math.random() * 10),
        fitnessScore: null,
        freshnessScore: null,
        segmentEfforts: [
          {
            id: `${id}-seg-1`,
            name: type === "Run" ? "Riverside sprint" : "Hilltop climb",
            elapsedSeconds: Math.round(60 + Math.random() * 90),
            isPr: Math.random() > 0.7,
            leaderboardRank: Math.round(5 + Math.random() * 200),
            leaderboardTotal: 1840,
          },
        ],
        powerCurve: hasPower
          ? [
              { duration: "5s", watts: 620 },
              { duration: "1min", watts: 410 },
              { duration: "5min", watts: 305 },
              { duration: "20min", watts: 268 },
            ]
          : null,
      }
    : {
        relativeEffort: null,
        fitnessScore: null,
        freshnessScore: null,
        segmentEfforts: null,
        powerCurve: null,
      };

  const streams = streamFor(distanceMeters, movingSeconds, paceMinPerKm, avgHr, elevGain > 60, hasPower, seed);
  const decimated = streams.filter((_, i) => i % 3 === 0).map((p) => p.latlng);
  const summaryPolyline = encodePolyline(decimated);

  const MET_BY_TYPE = { Run: 9.8, Ride: 7.5, Swim: 6.0 };
  const calories = Math.round((MET_BY_TYPE[type] ?? 7) * 70 * (movingSeconds / 3600));

  return {
    id,
    athleteId,
    name,
    type,
    startDate,
    distanceMeters,
    movingSeconds,
    elevationGainMeters: elevGain,
    averageHeartrate: avgHr,
    averagePace: Number(paceMinPerKm.toFixed(2)),
    averageWatts: hasPower ? 280 : null,
    calories,
    caloriesEstimated: false,
    premium: premiumFields,
    streams,
    summaryPolyline,
  };
}

const premiumActivities = [
  makeActivity({ id: "p-act-1", athleteId: "athlete-premium", name: "Morning tempo run", type: "Run", daysAgo: 1, distanceKm: 8.2, paceMinPerKm: 5.0, avgHr: 162, elevGain: 45, hard: 0.7, premium: true }),
  makeActivity({ id: "p-act-2", athleteId: "athlete-premium", name: "Easy recovery jog", type: "Run", daysAgo: 3, distanceKm: 5.0, paceMinPerKm: 6.2, avgHr: 134, elevGain: 10, hard: 0.2, premium: true }),
  makeActivity({ id: "p-act-3", athleteId: "athlete-premium", name: "Hill repeats", type: "Run", daysAgo: 5, distanceKm: 9.6, paceMinPerKm: 5.4, avgHr: 168, elevGain: 180, hard: 0.85, premium: true }),
  makeActivity({ id: "p-act-4", athleteId: "athlete-premium", name: "Sunday long run", type: "Run", daysAgo: 8, distanceKm: 18.0, paceMinPerKm: 5.6, avgHr: 152, elevGain: 90, hard: 0.6, premium: true }),
  makeActivity({ id: "p-act-5", athleteId: "athlete-premium", name: "Threshold ride", type: "Ride", daysAgo: 10, distanceKm: 32.0, paceMinPerKm: 2.1, avgHr: 158, elevGain: 220, hard: 0.75, premium: true, hasPower: true }),
  makeActivity({ id: "p-act-6", athleteId: "athlete-premium", name: "Easy spin", type: "Ride", daysAgo: 12, distanceKm: 20.0, paceMinPerKm: 2.6, avgHr: 128, elevGain: 60, hard: 0.25, premium: true, hasPower: true }),
  makeActivity({ id: "p-act-7", athleteId: "athlete-premium", name: "Track intervals", type: "Run", daysAgo: 14, distanceKm: 7.0, paceMinPerKm: 4.7, avgHr: 172, elevGain: 5, hard: 0.9, premium: true }),
  makeActivity({ id: "p-act-8", athleteId: "athlete-premium", name: "Weekday base run", type: "Run", daysAgo: 16, distanceKm: 6.5, paceMinPerKm: 5.8, avgHr: 145, elevGain: 30, hard: 0.4, premium: true }),
  makeActivity({ id: "p-act-9", athleteId: "athlete-premium", name: "Long ride", type: "Ride", daysAgo: 19, distanceKm: 55.0, paceMinPerKm: 2.3, avgHr: 150, elevGain: 410, hard: 0.65, premium: true, hasPower: true }),
  makeActivity({ id: "p-act-10", athleteId: "athlete-premium", name: "Recovery swim", type: "Swim", daysAgo: 21, distanceKm: 2.0, paceMinPerKm: 22.0, avgHr: 120, elevGain: 0, hard: 0.2, premium: true }),
];

const freeActivities = [
  makeActivity({ id: "f-act-1", athleteId: "athlete-free", name: "Park loop", type: "Run", daysAgo: 1, distanceKm: 6.0, paceMinPerKm: 5.9, avgHr: 150, elevGain: 20, hard: 0.5, premium: false }),
  makeActivity({ id: "f-act-2", athleteId: "athlete-free", name: "Easy jog", type: "Run", daysAgo: 4, distanceKm: 4.5, paceMinPerKm: 6.5, avgHr: 130, elevGain: 8, hard: 0.2, premium: false }),
  makeActivity({ id: "f-act-3", athleteId: "athlete-free", name: "Weekend long run", type: "Run", daysAgo: 7, distanceKm: 12.0, paceMinPerKm: 6.0, avgHr: 148, elevGain: 60, hard: 0.55, premium: false }),
  makeActivity({ id: "f-act-4", athleteId: "athlete-free", name: "Lunch ride", type: "Ride", daysAgo: 9, distanceKm: 15.0, paceMinPerKm: 2.8, avgHr: 132, elevGain: 80, hard: 0.3, premium: false }),
  makeActivity({ id: "f-act-5", athleteId: "athlete-free", name: "Hill run", type: "Run", daysAgo: 13, distanceKm: 7.5, paceMinPerKm: 5.7, avgHr: 160, elevGain: 140, hard: 0.7, premium: false }),
  makeActivity({ id: "f-act-6", athleteId: "athlete-free", name: "Short recovery jog", type: "Run", daysAgo: 15, distanceKm: 3.5, paceMinPerKm: 6.8, avgHr: 125, elevGain: 5, hard: 0.15, premium: false }),
];

const athletes = [
  { id: "athlete-premium", name: "Primawan (Premium)", isPremium: true, profilePictureUrl: null },
  { id: "athlete-free", name: "Primawan (Free)", isPremium: false, profilePictureUrl: null },
];

writeFileSync("data/sample/athletes.json", JSON.stringify(athletes, null, 2));
writeFileSync(
  "data/sample/activities.json",
  JSON.stringify([...premiumActivities, ...freeActivities], null, 2)
);

console.log("Generated sample data:", premiumActivities.length + freeActivities.length, "activities");
