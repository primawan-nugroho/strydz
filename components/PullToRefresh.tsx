"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { haptic } from "@/lib/haptics";

const THRESHOLD = 70; // px of pull needed to trigger a refresh
const MAX_PULL = 110;
const RING_R = 15;
const RING_C = 2 * Math.PI * RING_R;

/** Touch-driven pull-to-refresh for the installed PWA (standalone mode has no browser
 * refresh UI). A circular progress ring fills as you pull; at the threshold the badge pops
 * with a haptic tick, and releasing runs router.refresh() with a spinner. */
export default function PullToRefresh() {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [armed, setArmed] = useState(false); // past threshold — drives the pop animation
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        setDragging(false);
        setArmed(false);
        return;
      }
      // Rubber-band: diminishing movement the further you pull
      const eased = Math.min(MAX_PULL, delta * 0.45);
      if (eased >= THRESHOLD && pullRef.current < THRESHOLD) {
        haptic(8); // crossing the trigger point
        setArmed(true);
      } else if (eased < THRESHOLD && pullRef.current >= THRESHOLD) {
        setArmed(false);
      }
      pullRef.current = eased;
      setPull(eased);
      setDragging(true);
    }

    function onTouchEnd() {
      if (startY.current == null) return;
      startY.current = null;
      setDragging(false);
      if (pullRef.current >= THRESHOLD && !refreshing) {
        setRefreshing(true);
        setArmed(false);
        setPull(THRESHOLD * 0.75);
        router.refresh();
        // router.refresh() has no completion signal; hold the spinner briefly.
        setTimeout(() => {
          setRefreshing(false);
          setPull(0);
          pullRef.current = 0;
        }, 1200);
      } else {
        setArmed(false);
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
  // Badge grows in as you pull (0.6 → 1), pops slightly past 1 when armed.
  const badgeScale = refreshing ? 1 : armed ? 1.12 : 0.6 + progress * 0.4;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-1/2 -translate-x-1/2 z-40"
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(0, pull - 46)}px)`,
        opacity: visible ? 1 : 0,
        transition: dragging ? "none" : "top 0.25s cubic-bezier(0.34,1.4,0.64,1), opacity 0.2s ease",
      }}
    >
      <div
        className="relative w-10 h-10 rounded-full bg-surface-1 border border-border shadow-md flex items-center justify-center"
        style={{
          transform: `scale(${badgeScale})`,
          transition: dragging ? "transform 0.12s ease" : "transform 0.25s cubic-bezier(0.34,1.6,0.64,1)",
        }}
      >
        {/* Progress ring fills as you approach the trigger threshold */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r={RING_R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={RING_C}
            strokeDashoffset={refreshing ? 0 : RING_C * (1 - progress)}
            opacity={refreshing ? 0 : 0.9}
            style={{ transition: dragging ? "none" : "stroke-dashoffset 0.2s ease, opacity 0.2s ease" }}
          />
        </svg>
        <RefreshCw
          size={17}
          className={`text-accent ${refreshing ? "animate-spin" : ""}`}
          style={
            refreshing
              ? undefined
              : {
                  transform: `rotate(${progress * 180}deg)`,
                  opacity: 0.35 + progress * 0.65,
                  transition: dragging ? "none" : "transform 0.2s ease",
                }
          }
        />
      </div>
    </div>
  );
}
