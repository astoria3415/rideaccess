"use client";

import { useState } from "react";
import { Loader2, Send, Check } from "lucide-react";

/**
 * Admin action: email the customer a quoted price with a Stripe pay
 * link + QR for this booking.
 */
export function SendPaymentRequest({ bookingId }: { bookingId: string }) {
  const [amount, setAmount] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function send() {
    const cents = Math.round(parseFloat(amount) * 100);
    if (!cents || cents < 500) {
      setError("Min $5.00");
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/admin/payment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, amountCents: cents }),
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
        <Check className="h-3.5 w-3.5" aria-hidden /> Quote sent
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min="5"
        step="0.01"
        placeholder="$"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        aria-label="Quote amount in dollars"
      />
      <button
        type="button"
        onClick={send}
        disabled={state === "sending"}
        className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        title="Email the customer a pay link for this amount"
      >
        {state === "sending" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Send className="h-3.5 w-3.5" aria-hidden />
        )}
        Quote
      </button>
      {state === "error" && (
        <span className="text-xs text-red-600">{error}</span>
      )}
    </div>
  );
}
