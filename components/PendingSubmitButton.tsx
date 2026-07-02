"use client";

import { useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { haptic } from "@/lib/haptics";

/** Submit button for plain HTML form posts (full-page navigation). Shows a spinner from
 * the moment of the click until the browser navigates away, so the tap never feels dead. */
export default function PendingSubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: ReactNode;
  pendingLabel: string;
  className: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="submit"
      disabled={pending}
      onClick={() => {
        haptic();
        setPending(true);
      }}
      className={`pressable ${className} disabled:opacity-60`}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="animate-spin" /> {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
