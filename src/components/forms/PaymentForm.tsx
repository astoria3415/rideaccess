"use client";

import { useState } from "react";
import { Loader2, Lock, AlertCircle } from "lucide-react";

const PRESETS = [
  { label: "Deposit", amount: 2500 },
  { label: "Standard Ride", amount: 6500 },
  { label: "Round Trip", amount: 12000 },
];

export function PaymentForm() {
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("Transportation payment");
  const [amount, setAmount] = useState(6500);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cents = custom
      ? Math.round(parseFloat(custom) * 100)
      : amount;

    if (!email || !cents || cents < 500) {
      setError("Please enter a valid email and an amount of at least $5.00.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: cents, description, email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePay} className="card space-y-5">
      <div>
        <label className="label">Email for receipt *</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="label">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="field"
        />
      </div>

      <div>
        <label className="label">Amount</label>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setAmount(p.amount);
                setCustom("");
              }}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                amount === p.amount && !custom
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-slate-200 text-slate-600 hover:border-secondary"
              }`}
            >
              {p.label}
              <span className="mt-1 block font-heading text-base font-bold text-primary">
                ${(p.amount / 100).toFixed(0)}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="label">Or enter a custom amount (USD)</label>
          <input
            type="number"
            min="5"
            step="0.01"
            placeholder="e.g. 85.00"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="field"
          />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" aria-hidden /> {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Redirecting…
          </>
        ) : (
          <>
            <Lock className="h-5 w-5" aria-hidden /> Pay Securely
          </>
        )}
      </button>
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
        <Lock className="h-3.5 w-3.5" aria-hidden /> Secured by Stripe · Cards,
        Apple Pay, Google Pay &amp; Link
      </p>
    </form>
  );
}
