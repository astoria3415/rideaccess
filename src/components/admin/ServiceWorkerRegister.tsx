"use client";

import { useEffect } from "react";

/**
 * Registers the push service worker for the admin PWA. Mounted inside the
 * admin shell so it only runs for signed-in admins — never on the public
 * site. Registration is idempotent; the browser reuses an existing worker.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[sw] registration failed", err);
    });
  }, []);

  return null;
}
