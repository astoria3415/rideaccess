"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { CheckCircle2, Loader2, AlertCircle, Lock } from "lucide-react";
import { bookingSchema, type BookingInput } from "@/lib/validations";
import { services } from "@/lib/data/services";
import { AddressAutocomplete } from "./AddressAutocomplete";

export function BookingForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { wheelchairRequired: false, roundTrip: false },
  });

  const pickupAddress = watch("pickupAddress");
  const destinationAddress = watch("destinationAddress");

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingEmail, setBookingEmail] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");

  const DEPOSIT_CENTS = 5000; // $50 booking deposit

  async function onSubmit(values: BookingInput) {
    setStatus("idle");
    setServerError("");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setBookingId(data.id ?? null);
      setBookingEmail(values.email);
      setStatus("success");
      reset();
    } catch (err) {
      setStatus("error");
      setServerError(err instanceof Error ? err.message : "Please try again.");
    }
  }

  async function payDeposit() {
    setDepositError("");
    setDepositLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: DEPOSIT_CENTS,
          description: "Booking deposit — Ride Access NYC",
          email: bookingEmail,
          bookingId: bookingId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Could not start payment.");
      }
      window.location.href = data.url;
    } catch (err) {
      setDepositError(
        err instanceof Error ? err.message : "Please try again.",
      );
      setDepositLoading(false);
    }
  }

  if (status === "success") {
    return (
      <div className="card flex flex-col items-center py-12 text-center">
        <CheckCircle2 className="h-14 w-14 text-success" aria-hidden />
        <h3 className="mt-4 text-2xl font-bold">Booking Request Received!</h3>
        <p className="mt-2 max-w-md text-slate-600">
          Thank you. Our team will confirm your ride by phone and email shortly.
          A confirmation has been sent to your inbox.
        </p>

        <div className="mt-6 w-full max-w-md rounded-2xl border border-primary-100 bg-primary-50/60 p-5">
          <p className="font-semibold text-primary">
            Reserve your ride with a $50 deposit
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Securing a small refundable deposit lets us lock in your driver and
            time. The $50 is applied toward your fare.
          </p>
          <button
            type="button"
            onClick={payDeposit}
            disabled={depositLoading}
            className="btn-primary mt-4 w-full"
          >
            {depositLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Redirecting…
              </>
            ) : (
              <>
                <Lock className="h-5 w-5" aria-hidden /> Pay $50 Deposit
              </>
            )}
          </button>
          {depositError && (
            <p className="mt-2 text-sm text-red-600">{depositError}</p>
          )}
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Secured by Stripe · Card,
            Apple Pay, Google Pay &amp; Link
          </p>
        </div>

        <button
          type="button"
          className="btn-outline mt-4"
          onClick={() => setStatus("idle")}
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5" noValidate>
      {/* Honeypot */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden
        {...register("company")}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Passenger Name" error={errors.passengerName?.message} required>
          <input className="field" autoComplete="name" {...register("passengerName")} />
        </Field>
        <Field label="Phone Number" error={errors.phone?.message} required>
          <input className="field" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message} required>
        <input className="field" type="email" autoComplete="email" {...register("email")} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <AddressAutocomplete
          id="pickupAddress"
          label="Pickup Address"
          placeholder="Enter pickup address"
          value={pickupAddress}
          onChange={(addr) => setValue("pickupAddress", addr)}
          error={errors.pickupAddress?.message}
          required
        />
        <AddressAutocomplete
          id="destinationAddress"
          label="Destination Address"
          placeholder="Enter destination address"
          value={destinationAddress}
          onChange={(addr) => setValue("destinationAddress", addr)}
          error={errors.destinationAddress?.message}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Date" error={errors.rideDate?.message} required>
          <input className="field" type="date" {...register("rideDate")} />
        </Field>
        <Field label="Time" error={errors.rideTime?.message} required>
          <input className="field" type="time" {...register("rideTime")} />
        </Field>
        <Field label="Service Type" error={errors.serviceType?.message} required>
          <select className="field" defaultValue="" {...register("serviceType")}>
            <option value="" disabled>
              Select…
            </option>
            {services.map((s) => (
              <option key={s.slug} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-secondary" {...register("wheelchairRequired")} />
          Wheelchair Required
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-primary focus:ring-secondary" {...register("roundTrip")} />
          Round Trip
        </label>
      </div>

      <Field label="Additional Notes" error={errors.notes?.message}>
        <textarea
          className="field min-h-[110px] resize-y"
          placeholder="Mobility needs, gate codes, special instructions…"
          {...register("notes")}
        />
      </Field>

      {status === "error" && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5" aria-hidden /> {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Submitting…
          </>
        ) : (
          "Request My Ride"
        )}
      </button>
      <p className="text-center text-xs text-slate-500">
        By submitting you agree to be contacted about your transportation
        request. We never share your information.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
