"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, Send, AlertCircle, CheckCircle2 } from "lucide-react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

// VAPID keys are URL-safe base64; the Push API needs a Uint8Array backed by
// a plain ArrayBuffer (not SharedArrayBuffer) to satisfy BufferSource.
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type State = "loading" | "unsupported" | "denied" | "off" | "on";

export function PushSetup() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // iOS only allows push from the installed (home-screen) app.
  const [needsInstall, setNeedsInstall] = useState(false);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    if (!supported) {
      // iOS Safari (not installed) has no PushManager — guide to install.
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error iOS-only Safari flag
        window.navigator.standalone === true;
      if (isIOS && !standalone) setNeedsInstall(true);
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was not granted.");
        setState(permission === "denied" ? "denied" : "off");
        return;
      }
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const json = sub.toJSON();
      const res = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save subscription.");
      }
      setState("on");
      setMessage("Notifications enabled on this device.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/admin/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState("off");
      setMessage("Notifications turned off on this device.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/admin/push/test", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Test failed.");
      setMessage(
        data.sent > 0
          ? `Test sent to ${data.sent} device${data.sent === 1 ? "" : "s"}.`
          : "No devices are subscribed yet.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" aria-hidden />
        <h3 className="font-semibold">Push notifications</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Get alerted on this device the moment a booking, contact request, or
        payment comes in. Enable it on each phone that should be notified.
      </p>

      {needsInstall && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          On iPhone, first tap the Share button in Safari and choose{" "}
          <strong>Add to Home Screen</strong>. Then open this page from the new
          app icon and enable notifications here.
        </p>
      )}

      {state === "unsupported" && !needsInstall && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <AlertCircle className="h-4 w-4" aria-hidden />
          This browser doesn&apos;t support push notifications.
        </p>
      )}

      {state === "denied" && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" aria-hidden />
          Notifications are blocked. Enable them for this site in your browser
          settings, then reload.
        </p>
      )}

      {(state === "off" || state === "on" || state === "loading") && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {state === "on" ? (
            <>
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Enabled on this
                device
              </span>
              <button
                type="button"
                onClick={sendTest}
                disabled={busy}
                className="btn-outline px-4 py-2 text-sm"
              >
                <Send className="h-4 w-4" aria-hidden /> Send test
              </button>
              <button
                type="button"
                onClick={disable}
                disabled={busy}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600"
              >
                <BellOff className="h-4 w-4" aria-hidden /> Turn off
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={enable}
              disabled={busy || state === "loading"}
              className="btn-primary px-5 py-2.5 text-sm"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Bell className="h-4 w-4" aria-hidden />
              )}
              Enable notifications
            </button>
          )}
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm text-emerald-700">{message}</p>
      )}
      {error && (
        <p className="mt-3 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
