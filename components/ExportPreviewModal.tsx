"use client";

import { useRef, useState } from "react";
import { Download, X, ChevronLeft, ChevronRight, Share } from "lucide-react";

export interface PreviewImage {
  label: string;
  url: string;
}

export default function ExportPreviewModal({
  images,
  canShare,
  onCancel,
  onDownload,
  onShare,
}: {
  images: PreviewImage[];
  canShare: boolean;
  onCancel: () => void;
  onDownload: (index: number) => void;
  onShare: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  function go(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) go(delta > 0 ? -1 : 1);
    touchStartX.current = null;
  }

  const current = images[index];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md bg-surface-2 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] font-medium">
            Preview <span className="text-text-muted">· {current.label}</span>
          </p>
          <button type="button" onClick={onCancel} aria-label="Close preview">
            <X size={18} className="text-text-muted" />
          </button>
        </div>

        <div
          className="relative rounded-xl overflow-hidden mb-2"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{
            backgroundImage:
              "linear-gradient(45deg, #80808022 25%, transparent 25%), linear-gradient(-45deg, #80808022 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #80808022 75%), linear-gradient(-45deg, transparent 75%, #80808022 75%)",
            backgroundSize: "20px 20px",
            backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.url} alt={`Export preview: ${current.label}`} className="w-full h-auto block" />

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous layout"
                onClick={() => go(-1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <ChevronLeft size={18} className="text-white" />
              </button>
              <button
                type="button"
                aria-label="Next layout"
                onClick={() => go(1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mb-2">
            {images.map((img, i) => (
              <button
                key={img.label}
                type="button"
                aria-label={`Show ${img.label}`}
                onClick={() => setIndex(i)}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i === index ? "var(--accent)" : "var(--border)" }}
              />
            ))}
          </div>
        )}

        <p className="text-[11px] text-text-muted text-center mb-3">
          {images.length > 1 ? "Swipe or use the arrows to try another layout. " : ""}
          Checkered areas are transparent in the exported PNG.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-border text-[13px] font-medium py-2.5"
          >
            Cancel
          </button>
          {canShare && (
            <button
              type="button"
              onClick={() => onShare(index)}
              className="flex-1 flex items-center justify-center gap-2 rounded-full border border-border text-[13px] font-medium py-2.5"
            >
              <Share size={16} /> Share
            </button>
          )}
          <button
            type="button"
            onClick={() => onDownload(index)}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-accent-bg text-accent-text text-[13px] font-medium py-2.5"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>
    </div>
  );
}
