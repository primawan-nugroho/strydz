"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Lightbulb, Settings } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/activities", label: "Activities", icon: BarChart3 },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md bg-surface-1 border-t border-border flex justify-around py-2 px-2">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 px-3 py-1"
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
