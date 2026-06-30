/** Interpretive bands for each analytic. Thresholds come from sports-science norms where
 * an accepted one exists (ACWR, Strava Relative Effort), and from sensible relative bands
 * where the metric is our own unit (training load). Each rating carries a tone for color,
 * a short label, a plain-language description, and the scale stops so the UI can render a
 * low/med/high strip showing where the current value falls. */

export type Tone = "muted" | "success" | "warning" | "danger" | "accent";

export interface Rating {
  band: string;
  tone: Tone;
  /** 0–1 position of the current value along the rendered scale. */
  position: number;
  description: string;
  /** Ordered scale segments for the low/med/high strip. */
  scale: { label: string; tone: Tone }[];
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/** ACWR — acute:chronic workload ratio. The 0.8–1.3 "sweet spot" is the widely cited
 * injury-risk-minimizing band (Gabbett, 2016); >1.5 is the high-risk spike zone. */
export function rateAcwr(acwr: number): Rating {
  const scale: Rating["scale"] = [
    { label: "Detraining", tone: "warning" },
    { label: "Optimal", tone: "success" },
    { label: "Building", tone: "accent" },
    { label: "High risk", tone: "danger" },
  ];
  const position = clamp01(acwr / 2); // strip spans 0–2.0
  if (acwr < 0.8)
    return {
      band: "Detraining",
      tone: "warning",
      position,
      scale,
      description:
        "Below 0.8: your recent load has dropped well under your 4-week baseline. Fine for a taper or recovery week, but sustained low values mean fitness is fading.",
    };
  if (acwr <= 1.3)
    return {
      band: "Optimal",
      tone: "success",
      position,
      scale,
      description:
        "0.8–1.3 is the sweet spot: you're progressively overloading while keeping injury risk low. This is where you want to live most weeks.",
    };
  if (acwr <= 1.5)
    return {
      band: "Building hard",
      tone: "accent",
      position,
      scale,
      description:
        "1.3–1.5: you're loading aggressively. Sustainable short-term for a build block, but prioritise sleep and easy days.",
    };
  return {
    band: "High risk",
    tone: "danger",
    position,
    scale,
    description:
      "Above 1.5: a sharp spike versus your 4-week norm. This is the zone most associated with overuse injury — back off or insert recovery.",
  };
}

/** Acute (7-day) load judged against the athlete's own chronic weekly average, since the
 * unit (AU) is relative. <70% = easy week, 70–130% = typical, >130% = overload week. */
export function rateWeeklyLoad(acuteLoad7d: number, chronicLoad28d: number): Rating {
  const scale: Rating["scale"] = [
    { label: "Light", tone: "muted" },
    { label: "Typical", tone: "success" },
    { label: "Heavy", tone: "accent" },
    { label: "Overload", tone: "danger" },
  ];
  const ratio = chronicLoad28d > 0 ? acuteLoad7d / chronicLoad28d : 1;
  const position = clamp01(ratio / 1.8);
  if (chronicLoad28d === 0)
    return {
      band: "No baseline",
      tone: "muted",
      position: 0,
      scale,
      description:
        "Weekly load is your total training stress over the last 7 days in arbitrary units (AU) — each session scored by duration × intensity. Needs a few weeks of history before it's meaningful.",
    };
  const base =
    "Weekly load (AU) is your total training stress over the last 7 days — each session scored by duration × intensity. It's judged against your typical week (the 4-week average). ";
  if (ratio < 0.7)
    return { band: "Light", tone: "muted", position, scale, description: base + "Below 70% of your norm — an easy or recovery week." };
  if (ratio <= 1.3)
    return { band: "Typical", tone: "success", position, scale, description: base + "Within ±30% of your norm — a steady, sustainable week." };
  if (ratio <= 1.5)
    return { band: "Heavy", tone: "accent", position, scale, description: base + "30–50% above your norm — a deliberate build week. Recover well." };
  return { band: "Overload", tone: "danger", position, scale, description: base + "More than 50% above your norm — a big spike. Watch for fatigue and injury." };
}

/** Strava Relative Effort (suffer score): HR-time-in-zone weighted effort for one activity.
 * Common bands: <50 light, 50–99 moderate, 100–149 hard, 150+ epic. */
export function rateRelativeEffort(value: number): Rating {
  const scale: Rating["scale"] = [
    { label: "Light", tone: "muted" },
    { label: "Moderate", tone: "success" },
    { label: "Hard", tone: "accent" },
    { label: "Epic", tone: "danger" },
  ];
  const position = clamp01(value / 200);
  const base = "Relative Effort scores a single session by how long you spent in each heart-rate zone. ";
  if (value < 50) return { band: "Light", tone: "muted", position, scale, description: base + "Under 50: an easy, low-strain session." };
  if (value < 100) return { band: "Moderate", tone: "success", position, scale, description: base + "50–100: a solid, moderate workout." };
  if (value < 150) return { band: "Hard", tone: "accent", position, scale, description: base + "100–150: a hard session that drives fitness gains." };
  return { band: "Epic", tone: "danger", position, scale, description: base + "150+: a very demanding effort — make the next day easy." };
}

/** Pace consistency: 100 − coefficient of variation of pace. Higher = more even pacing. */
export function ratePaceConsistency(percent: number): Rating {
  const scale: Rating["scale"] = [
    { label: "Variable", tone: "warning" },
    { label: "Steady", tone: "success" },
    { label: "Metronomic", tone: "success" },
  ];
  const position = clamp01((percent - 60) / 40); // strip spans 60–100%
  const base = "Pace consistency is how even your pace was across the activity (100% = perfectly steady). ";
  if (percent < 80)
    return { band: "Variable", tone: "warning", position, scale, description: base + "Under 80%: pacing swung a lot — expected for intervals or hilly routes, less ideal for steady runs." };
  if (percent < 90)
    return { band: "Steady", tone: "success", position, scale, description: base + "80–90%: well-controlled, even pacing." };
  return { band: "Metronomic", tone: "success", position, scale, description: base + "Above 90%: remarkably even — excellent pacing discipline." };
}

/** Fitness level is already categorical (from ACWR); this just supplies the descriptions. */
export function describeFitnessLevel(level: string): string {
  switch (level) {
    case "Detraining":
      return "Your training load has fallen below maintenance — fitness is gradually declining. Add volume to rebuild.";
    case "Maintaining":
      return "Load is steady around your baseline — you're holding fitness rather than building it.";
    case "Building":
      return "Load is trending up at a healthy rate — you're getting fitter while keeping injury risk manageable.";
    case "Peaking":
      return "Load is well above baseline — you're pushing hard. Great for a peak block, but not sustainable indefinitely.";
    default:
      return "";
  }
}

export const TONE_TEXT: Record<Tone, string> = {
  muted: "text-text-muted",
  success: "text-success-text",
  warning: "text-warning-text",
  danger: "text-danger-text",
  accent: "text-accent-text",
};

export const TONE_BG: Record<Tone, string> = {
  muted: "bg-surface-1",
  success: "bg-success-bg",
  warning: "bg-warning-bg",
  danger: "bg-danger-bg",
  accent: "bg-accent-bg",
};

/** CSS var for the solid fill used in the scale strip segments. */
export const TONE_FILL: Record<Tone, string> = {
  muted: "var(--muted-fill)",
  success: "var(--success-fill)",
  warning: "var(--warning-fill)",
  danger: "var(--danger-fill)",
  accent: "var(--accent)",
};
