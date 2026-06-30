"use client";

import { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

/** Tap/click-to-toggle info popover — works on touch (hover-only tooltips don't). */
export default function InfoTooltip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        aria-label={`What is ${label}?`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center text-text-muted"
      >
        <Info size={13} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 -translate-x-1/2 top-5 z-20 w-56 rounded-xl bg-surface-1 border border-border p-2.5 text-[11px] leading-snug text-text-secondary shadow-lg"
        >
          <span className="block font-medium text-text-primary mb-0.5">{label}</span>
          {text}
        </span>
      )}
    </span>
  );
}
