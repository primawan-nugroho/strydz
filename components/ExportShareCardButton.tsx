"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadBlob, renderShareCardPng, SHARE_CARD_LAYOUTS } from "@/lib/export/shareCard";
import ExportPreviewModal from "@/components/ExportPreviewModal";
import { haptic } from "@/lib/haptics";
import type { Activity } from "@/lib/activities/types";

interface RenderedLayout {
  id: string;
  label: string;
  blob: Blob;
  url: string;
}

export default function ExportShareCardButton({ activity }: { activity: Activity }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [layouts, setLayouts] = useState<RenderedLayout[] | null>(null);
  // Bumped when the preview closes so in-flight background renders know to stop appending.
  const sessionRef = useRef(0);

  async function handleClick() {
    haptic();
    setBusy(true);
    setError(false);
    const session = ++sessionRef.current;

    try {
      // Render the first layout and open the preview immediately...
      const first = SHARE_CARD_LAYOUTS[0];
      const firstBlob = await renderShareCardPng(activity, first.id);
      if (sessionRef.current !== session) return;
      setLayouts([{ id: first.id, label: first.label, blob: firstBlob, url: URL.createObjectURL(firstBlob) }]);
      setBusy(false);

      // ...then fill in the remaining layouts in the background as they finish.
      for (const layout of SHARE_CARD_LAYOUTS.slice(1)) {
        try {
          const blob = await renderShareCardPng(activity, layout.id);
          if (sessionRef.current !== session) return;
          setLayouts((prev) =>
            prev
              ? [...prev, { id: layout.id, label: layout.label, blob, url: URL.createObjectURL(blob) }]
              : prev
          );
        } catch {
          // Skip a layout that fails to render rather than killing the whole preview.
        }
      }
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  function closePreview() {
    sessionRef.current++;
    layouts?.forEach((l) => URL.revokeObjectURL(l.url));
    setLayouts(null);
  }

  function confirmDownload(index: number) {
    const layout = layouts?.[index];
    if (!layout) return;
    downloadBlob(layout.blob, `strydz-${activity.id}-${layout.id}.png`);
    closePreview();
  }

  async function confirmShare(index: number) {
    const layout = layouts?.[index];
    if (!layout) return;
    const file = new File([layout.blob], `strydz-${activity.id}-${layout.id}.png`, {
      type: "image/png",
    });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: activity.name });
        closePreview();
        return;
      }
    } catch {
      // user cancelled the share sheet, or share failed — leave the preview open
      return;
    }
    // No file-share support: fall back to a download.
    downloadBlob(layout.blob, file.name);
    closePreview();
  }

  // Web Share with files isn't available on most desktops; only offer it where it works.
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [new File([new Blob()], "x.png", { type: "image/png" })] });

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="pressable w-full flex items-center justify-center gap-2 rounded-full bg-accent-bg text-accent-text text-[13px] font-medium py-2.5 disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {busy ? "Generating preview…" : "Export route as PNG"}
      </button>
      {error && (
        <p className="text-[11px] text-accent-text text-center mt-1.5">
          Couldn&apos;t generate the image. Try again.
        </p>
      )}
      {layouts && (
        <ExportPreviewModal
          images={layouts}
          totalCount={SHARE_CARD_LAYOUTS.length}
          canShare={canShare}
          onCancel={closePreview}
          onDownload={confirmDownload}
          onShare={confirmShare}
        />
      )}
    </div>
  );
}
