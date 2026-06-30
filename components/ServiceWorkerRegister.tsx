"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return; // avoid SW caching during dev
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures are non-fatal — the app still works without offline support.
    });
  }, []);

  return null;
}
