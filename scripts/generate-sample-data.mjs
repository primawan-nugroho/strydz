import { writeFileSync, mkdirSync } from "fs";

mkdirSync("data/sample", { recursive: true });

function streamFor(distanceMeters, movingSeconds, basePace, baseHr, hilly, hasPower) {
  const points = 24;
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
    });
  }
  return stream;
}

function makeActivity({ id, athleteId, name, type, daysAgo, distanceKm, paceMinPerKm, avgHr, elevGain, hard, premium, hasPower }) {
  const distanceMeters = Math.round(distanceKm * 1000);
  const movingSeconds = Math.round(distanceKm * paceMinPerKm * 60);
  const startDate = new Date(Date.now() - daysAgo * 86400000).toISOString();

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
    premium: premiumFields,
    streams: streamFor(distanceMeters, movingSeconds, paceMinPerKm, avgHr, elevGain > 60, hasPower),
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
  { id: "athlete-premium", name: "Primawan (Premium)", isPremium: true },
  { id: "athlete-free", name: "Primawan (Free)", isPremium: false },
];

writeFileSync("data/sample/athletes.json", JSON.stringify(athletes, null, 2));
writeFileSync(
  "data/sample/activities.json",
  JSON.stringify([...premiumActivities, ...freeActivities], null, 2)
);

console.log("Generated sample data:", premiumActivities.length + freeActivities.length, "activities");
