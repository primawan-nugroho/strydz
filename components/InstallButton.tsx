"use client";

import { useEffect, useState } from "react";
import { Download, Share, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallButton() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) setInstalled(true);

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else if (isIos()) {
      setShowIosHelp((v) => !v);
    }
  }

  if (installed) {
    return (
      <p className="text-[12px] text-text-muted flex items-center gap-1.5">
        <Check size={14} className="text-success-text" /> Installed on this device.
      </p>
    );
  }

  // Nothing to offer: not iOS and the browser hasn't fired the install event (already
  // installed elsewhere, unsupported browser, or criteria not yet met).
  if (!deferred && !isIos()) {
    return (
      <p className="text-[12px] text-text-muted">
        Open this site in Chrome on Android (or Safari on iOS) to add STRYDZ to your home screen.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleInstall}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-accent-bg text-accent-text text-[13px] font-medium py-2.5"
      >
        <Download size={16} /> Add STRYDZ to home screen
      </button>
      {showIosHelp && (
        <p className="text-[12px] text-text-secondary mt-2 flex items-start gap-1.5">
          <Share size={14} className="shrink-0 mt-0.5" />
          In Safari, tap the Share button, then &ldquo;Add to Home Screen&rdquo;.
        </p>
      )}
    </div>
  );
}
