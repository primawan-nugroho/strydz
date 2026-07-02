/** Tiny haptic tap for key interactions. Supported on Android Chrome; iOS Safari and
 * desktops silently no-op. Call from client components only. */
export function haptic(durationMs = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Some browsers throw if called without user activation — ignore.
    }
  }
}
