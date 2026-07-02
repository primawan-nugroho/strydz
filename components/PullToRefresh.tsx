"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { haptic } from "@/lib/haptics";

const THRESHOLD = 70; // px of pull needed to trigger a refresh
const MAX_PULL = 110;

/** Touch-driven pull-to-refresh for the installed PWA (standalone mode has no browser
 * refresh UI). Shows a spinner arc that follows the pull, then router.refresh() on release
 * past the threshold. Only engages when the page is scrolled to the very top. */
export default function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const firedRef = useRef(false);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      firedRef.current = false;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      // Rubber-band: diminishing movement the further you pull
      const eased = Math.min(MAX_PULL, delta * 0.45);
      if (eased >= THRESHOLD && pullRef.current < THRESHOLD && !firedRef.current) {
        haptic(15); // crossing the trigger point
        firedRef.current = true;
      }
      pullRef.current = eased;
      setPull(eased);
    }

    function onTouchEnd() {
      if (startY.current == null) return;
      startY.current = null;
      if (pullRef.current >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setPull(THRESHOLD * 0.8);
        router.refresh();
        // router.refresh() has no completion signal; hold the spinner briefly.
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }, 1200);
      } else {
        setPull(0);
        pullRef.current = 0;
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing, router]);

  const visible = pull > 4 || refreshing;
  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-40 flex items-center justify-center"
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(0, pull - 44)}px)`,
        opacity: visible ? 1 : 0,
        transition: startY.current == null ? "top 0.2s ease, opacity 0.2s ease" : "none",
      }}
    >
      <div className="w-9 h-9 rounded-full bg-surface-1 border border-border shadow-sm flex items-center justify-center">
        <RefreshCw
          size={18}
          className={`text-accent ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${progress * 270}deg)`, opacity: 0.4 + progress * 0.6 }}
        />
      </div>
    </div>
  );
}
