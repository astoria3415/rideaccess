"use client";

import { useState } from "react";
import { Loader2, Plus, Check } from "lucide-react";

const REASONS = ["Tolls", "Waiting time", "Extra stop", "Other"];

/**
 * Admin action for a paid booking: email the customer a pay link for an
 * extra charge (tolls, waiting time). Paying it adds to the booking total.
 */
export function AddExtraCharge({ bookingId }: { bookingId: string }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function send() {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 100) {
      setError("Min $1.00");
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/admin/extra-charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amountCents: cents, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-success">
        <Check className="h-3.5 w-3.5" aria-hidden /> {reason} link sent
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden /> Extra charge
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="rounded-lg border border-slate-200 px-1.5 py-1.5 text-xs"
        aria-label="Reason for extra charge"
      >
        {REASONS.map((r) => (
          <option key={r}>{r}</option>
        ))}
      </select>
      <input
        type="number"
        min="1"
        step="0.01"
        placeholder="$"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        aria-label="Extra charge in dollars"
      />
      <button
        type="button"
        onClick={send}
        disabled={state === "sending"}
        className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        title="Email the customer a pay link for this extra charge"
      >
        {state === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
        Send
      </button>
      {state === "error" && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
