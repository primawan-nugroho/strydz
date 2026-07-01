"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/Skeleton";
import { Sparkles } from "lucide-react";

type State = "loading" | "ready" | "error" | "disabled";

export default function CoachNote({ activityId }: { activityId: string }) {
  const [state, setState] = useState<State>("loading");
  const [text, setText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/coach/${activityId}`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 503) {
          // No API key configured — hide silently
          setState("disabled");
          return;
        }
        if (!res.ok || json.error || !json.narrative) {
          setErrorMsg(json.error ?? `HTTP ${res.status}`);
          setState("error");
          return;
        }
        setText(json.narrative);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [activityId]);

  if (state === "disabled") return null;

  return (
    <div className="bg-surface-2 rounded-2xl p-4 mb-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles size={14} className="text-accent-text" />
        <p className="text-[13px] font-medium">Coach&apos;s note</p>
        <span className="ml-auto text-[10px] text-text-muted bg-surface-1 rounded-full px-2 py-0.5">
          AI
        </span>
      </div>

      {state === "loading" && (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-11/12" />
          <Skeleton className="h-3 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      )}

      {state === "ready" && (
        <p className="text-[13px] text-text-secondary leading-relaxed">{text}</p>
      )}

      {state === "error" && (
        <p className="text-[12px] text-text-muted italic">
          Couldn&apos;t generate a note right now.{errorMsg ? ` (${errorMsg})` : ""}
        </p>
      )}
    </div>
  );
}
