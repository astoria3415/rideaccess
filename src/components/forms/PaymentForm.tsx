"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import {
  AIRPORTS,
  PICKUP_AREAS,
  RATES,
  calculateFare,
  type AirportCode,
  type PickupAreaCode,
} from "@/lib/pricing";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { estimateTrip } from "@/lib/geo";
import { site } from "@/lib/site";

const usd = (n: number) => `$${n.toFixed(2)}`;

export function PaymentForm() {
  const params = useSearchParams();
  const bookingId = params.get("booking");
  const ref = params.get("ref");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const isExtra = params.get("kind") === "extra";
  const [description, setDescription] = useState(
    params.get("desc") ?? (ref ? `Booking ${ref}` : "Transportation payment"),
  );
  const quoted = params.get("amount");
  const [airport, setAirport] = useState<AirportCode | "">("");
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [routeStatus, setRouteStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [pickup, setPickup] = useState<PickupAreaCode | "">("");
  const [miles, setMiles] = useState("");
  const [steps, setSteps] = useState("");
  const [roundTrip, setRoundTrip] = useState(false);
  const [tolls, setTolls] = useState("");
  const [wait, setWait] = useState("");
  const [custom, setCustom] = useState(
    quoted && !isNaN(parseFloat(quoted)) ? parseFloat(quoted).toFixed(2) : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const milesNum = parseFloat(miles);
  const hasMiles = !isNaN(milesNum) && milesNum > 0;
  const ready = (airport !== "" && pickup !== "") || (airport === "" && hasMiles);
  const fare = calculateFare({
    airport,
    pickup,
    miles: hasMiles ? milesNum : 0,
    steps: parseInt(steps, 10) || 0,
    roundTrip,
    tolls: parseFloat(tolls) || 0,
    waitMinutes: parseFloat(wait) || 0,
  });
  const amount = ready ? Math.round(fare.total * 100) : 0;

  // Auto-price from typed addresses: fills miles, airport and pickup area.
  useEffect(() => {
    if (pickupAddr.trim().length < 8 || dropoffAddr.trim().length < 8) {
      setRouteStatus("idle");
      return;
    }
    let cancelled = false;
    setRouteStatus("loading");
    const timer = setTimeout(async () => {
      try {
        const t = await estimateTrip(pickupAddr, dropoffAddr);
        if (cancelled) return;
        setAirport(t.airport);
        setPickup(t.pickup);
        setMiles(String(t.miles));
        setCustom("");
        setRouteStatus("done");
      } catch {
        if (!cancelled) setRouteStatus("error");
      }
    }, 900);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pickupAddr, dropoffAddr]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const cents = custom
      ? Math.round(parseFloat(custom) * 100)
      : amount;

    if (!email || !cents || cents < 500) {
      setError(
        "Please enter a valid email and the trip miles or an airport (or a custom amount of at least $5.00).",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: cents,
          description,
          email,
          bookingId: bookingId ?? undefined,
          kind: isExtra ? "extra" : "fare",
        }),
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

      {!isExtra && (
      <div>
        <label className="label">Trip fare</label>
        <div className="mb-3 space-y-3">
          <AddressAutocomplete
            id="calcPickup"
            label="Pickup address"
            placeholder="Enter pickup address"
            value={pickupAddr}
            onChange={setPickupAddr}
          />
          <AddressAutocomplete
            id="calcDropoff"
            label="Drop-off address"
            placeholder="Enter drop-off address or airport"
            value={dropoffAddr}
            onChange={setDropoffAddr}
          />
          {routeStatus === "loading" && (
            <p className="text-xs text-slate-500">Calculating your fare…</p>
          )}
          {routeStatus === "done" && (
            <p className="text-xs text-emerald-700">
              Fare calculated from your addresses. You can adjust the details
              below.
            </p>
          )}
          {routeStatus === "error" && (
            <p className="text-xs text-amber-700">
              We couldn&apos;t calculate the distance automatically. Choose the
              destination and enter the miles below.
            </p>
          )}
          <p className="text-xs text-slate-500">
            Or choose your trip manually:
          </p>
        </div>
        <div className="mb-3">
          <label className="label text-sm font-normal">Destination</label>
          <select
            value={airport}
            onChange={(e) => {
              setAirport(e.target.value as AirportCode | "");
              setCustom("");
            }}
            className="field"
          >
            <option value="">Anywhere in NYC (by miles)</option>
            {(Object.keys(AIRPORTS) as AirportCode[]).map((code) => (
              <option key={code} value={code}>
                {AIRPORTS[code].label} (flat fare)
              </option>
            ))}
          </select>
        </div>
        {airport && (
          <div className="mb-3">
            <label className="label text-sm font-normal">Pickup area</label>
            <select
              value={pickup}
              onChange={(e) => {
                setPickup(e.target.value as PickupAreaCode | "");
                setCustom("");
              }}
              className="field"
            >
              <option value="">Select pickup area</option>
              {(Object.keys(PICKUP_AREAS) as PickupAreaCode[]).map((code) => (
                <option key={code} value={code}>
                  {PICKUP_AREAS[code].label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className={airport ? "opacity-50" : ""}>
            <label className="label text-sm font-normal">Trip miles (one way)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              inputMode="decimal"
              placeholder="e.g. 8"
              disabled={airport !== ""}
              value={miles}
              onChange={(e) => {
                setMiles(e.target.value);
                setCustom("");
              }}
              className="field"
            />
          </div>
          <div>
            <label className="label text-sm font-normal">Steps needing help</label>
            <input
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="0"
              value={steps}
              onChange={(e) => {
                setSteps(e.target.value);
                setCustom("");
              }}
              className="field"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="label text-sm font-normal">
            Tolls for the whole trip, if any (USD)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={tolls}
            onChange={(e) => {
              setTolls(e.target.value);
              setCustom("");
            }}
            className="field"
          />
        </div>

        <div className="mt-3">
          <label className="label text-sm font-normal">
            Expected waiting time, in minutes (optional)
          </label>
          <input
            type="number"
            min="0"
            step="5"
            inputMode="numeric"
            placeholder="0"
            value={wait}
            onChange={(e) => {
              setWait(e.target.value);
              setCustom("");
            }}
            className="field"
          />
          <p className="mt-1 text-xs text-slate-500">
            First {RATES.freeWaitMinutes} minutes free, then{" "}
            {usd(RATES.perWaitMinute)}/minute. This is an estimate; the final
            charge uses the actual wait.
          </p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            { label: "One way", value: false },
            { label: "Round trip", value: true },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => {
                setRoundTrip(o.value);
                setCustom("");
              }}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                roundTrip === o.value
                  ? "border-primary bg-primary-50 text-primary"
                  : "border-slate-200 text-slate-600 hover:border-secondary"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {ready && !custom && (
          <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>
                {airport ? AIRPORTS[airport].label : `${milesNum} mi ride`}
                {roundTrip ? " (round trip)" : ""}
              </span>
              <span>{usd(fare.rideTotal)}</span>
            </div>
            {fare.stairsTotal > 0 && (
              <div className="flex justify-between">
                <span>
                  Stair assistance: {parseInt(steps, 10)} steps
                  {roundTrip ? " × 2 trips" : ""}
                </span>
                <span>{usd(fare.stairsTotal)}</span>
              </div>
            )}
            {fare.waitTotal > 0 && (
              <div className="flex justify-between">
                <span>Waiting time (estimate): {parseFloat(wait)} min</span>
                <span>{usd(fare.waitTotal)}</span>
              </div>
            )}
            {fare.tollsTotal > 0 && (
              <div className="flex justify-between">
                <span>Tolls</span>
                <span>{usd(fare.tollsTotal)}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between border-t border-slate-200 pt-1 font-heading font-bold text-primary">
              <span>Total</span>
              <span>{usd(fare.total)}</span>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-slate-500">
          {usd(RATES.baseFare)} base fare includes the first {RATES.includedMiles}{" "}
          miles, then {usd(RATES.perMile)}/mile. Airport trips are a flat fare.
          Stair help is {usd(RATES.perStep)}{" "}
          per step. Tolls are added at cost; waiting time beyond the free minutes is charged by the minute.
        </p>

      </div>
      )}

      <div>
        <div className={isExtra ? "" : "mt-4"}>
          <label className="label">
            {isExtra ? "Amount due (USD)" : "Or enter a custom / quoted amount (USD)"}
          </label>
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

      {site.zelle && (() => {
        const due = custom ? parseFloat(custom) || 0 : amount / 100;
        if (!due) return null;
        const z = Math.round(due * (1 - RATES.zelleDiscount) * 100) / 100;
        return (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">
              Save {Math.round(RATES.zelleDiscount * 100)}% with Zelle: pay {usd(z)}
            </p>
            <p className="mt-1">
              Send {usd(z)} by Zelle to <strong>{site.zelle}</strong> and put
              &quot;{description}&quot; in the memo. Card price: {usd(due)}.
            </p>
          </div>
        );
      })()}

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
        Apple Pay &amp; Google Pay
      </p>
    </form>
  );
}
