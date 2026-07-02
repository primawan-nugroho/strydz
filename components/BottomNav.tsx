"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, BarChart3, Lightbulb, Settings, Trophy } from "lucide-react";
import { haptic } from "@/lib/haptics";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/activities", label: "Activities", icon: BarChart3 },
  { href: "/records", label: "Records", icon: Trophy },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();
  // Optimistic active tab: highlight the tapped tab immediately instead of waiting for
  // the route change to commit (usePathname only updates after navigation).
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    setPending(null); // route committed — fall back to pathname-driven highlight
  }, [pathname]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-surface-1 border-t border-border flex justify-around px-2 pt-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const routeActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
        const active = pending != null ? pending === href : routeActive;
        return (
          <Link
            key={href}
            href={href}
            onClick={() => {
              haptic();
              setPending(href);
            }}
            className="pressable-strong flex flex-col items-center gap-1 px-2 py-1"
          >
            <Icon
              size={20}
              strokeWidth={1.75}
              className={active ? "text-text-primary" : "text-text-muted"}
            />
            <span
              className={`text-[11px] ${active ? "text-text-primary font-medium" : "text-text-muted"}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
