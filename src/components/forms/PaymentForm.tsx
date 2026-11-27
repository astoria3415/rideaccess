"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock, AlertCircle, Phone, CheckCircle2, Clock } from "lucide-react";
import { site } from "@/lib/site";

type Quote =
  | { state: "loading" }
  | { state: "not_found" }
  | { state: "no_quote"; bookingNumber: string }
  | { state: "paid"; bookingNumber: string }
  | { state: "ready"; bookingNumber: string; amountCents: number }
  | { state: "error" };

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Customers cannot type an amount. They pay only the quote the business
 * saved on their booking; the server charges that saved amount.
 */
export function PaymentForm() {
  const params = useSearchParams();
  const bookingId = params.get("booking");
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [quote, setQuote] = useState<Quote>({ state: "loading" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    fetch(`/api/payment-quote?booking=${encodeURIComponent(bookingId)}`)
      .then((r) => r.json().catch(() => ({ state: "error" })))
      .then((data) => {
        if (!cancelled) setQuote(data?.state ? data : { state: "error" });
      })
      .catch(() => !cancelled && setQuote({ state: "error" }));
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!bookingId) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, email: email || undefined }),
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

  // No booking link: there is nothing to pay until we send a quote.
  if (!bookingId || quote.state === "not_found") {
    return (
      <Notice
        icon={<Clock className="h-12 w-12 text-secondary" aria-hidden />}
        title="Request a quote first"
        text={
          bookingId
            ? "We couldn't find this booking. Please use the payment link from your quote email, or call us."
            : "Every trip is priced individually. Request a quote, and we'll call or text you with your price and send you a secure payment link."
        }
        showQuoteButton
      />
    );
  }

  if (quote.state === "loading") {
    return <div className="card h-72 animate-pulse" />;
  }

  if (quote.state === "error") {
    return (
      <Notice
        icon={<AlertCircle className="h-12 w-12 text-red-500" aria-hidden />}
        title="Something went wrong"
        text="We couldn't load your quote. Please try again in a moment, or call us."
      />
    );
  }

  if (quote.state === "no_quote") {
    return (
      <Notice
        icon={<Clock className="h-12 w-12 text-secondary" aria-hidden />}
        title="Your quote isn't ready yet"
        text={`We received booking ${quote.bookingNumber}. We'll call or text you with your price, then send you a payment link. No payment is needed until then.`}
      />
    );
  }

  if (quote.state === "paid") {
    return (
      <Notice
        icon={<CheckCircle2 className="h-12 w-12 text-success" aria-hidden />}
        title="Already paid"
        text={`Booking ${quote.bookingNumber} has already been paid. Thank you!`}
      />
    );
  }

  return (
    <form onSubmit={handlePay} className="card space-y-5">
      <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-6 text-center">
        <p className="text-sm font-medium text-slate-600">
          Your quote for booking {quote.bookingNumber}
        </p>
        <p className="mt-2 font-heading text-4xl font-bold text-primary">
          {money(quote.amountCents)}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          This is the price we confirmed with you. Questions? Call {site.phone}.
        </p>
      </div>

      <div>
        <label className="label" htmlFor="pay-email">
          Email for receipt
        </label>
        <input
          id="pay-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
          autoComplete="email"
        />
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
            <Lock className="h-5 w-5" aria-hidden /> Pay {money(quote.amountCents)} Securely
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

function Notice({
  icon,
  title,
  text,
  showQuoteButton,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  showQuoteButton?: boolean;
}) {
  return (
    <div className="card flex flex-col items-center py-12 text-center">
      {icon}
      <h2 className="mt-4 text-2xl font-bold">{title}</h2>
      <p className="mt-2 max-w-md text-slate-600">{text}</p>
      <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
        {showQuoteButton && (
          <Link href="/book" className="btn-primary">
            Request a Quote
          </Link>
        )}
        <a href={`tel:${site.phoneRaw}`} className="btn-outline">
          <Phone className="h-5 w-5" aria-hidden /> Call {site.phone}
        </a>
      </div>
    </div>
  );
}
