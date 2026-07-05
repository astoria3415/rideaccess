"use client";

import { useState, useTransition } from "react";
import { Loader2, Pencil, X } from "lucide-react";
import { updateBooking } from "@/app/admin/actions";

type Fields = {
  passenger_name: string;
  phone: string;
  email: string;
  pickup_address: string;
  destination_address: string;
  ride_date: string;
  ride_time: string;
  notes: string | null;
};

export function EditBookingDialog({
  id,
  booking,
  bookingNumber,
}: {
  id: string;
  booking: Fields;
  bookingNumber?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Fields>(booking);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await updateBooking(id, { ...form, notes: form.notes || null });
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setForm(booking);
          setError("");
          setOpen(true);
        }}
        aria-label="Edit booking"
        title="Edit booking"
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-surface hover:text-primary"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <form
            onSubmit={onSubmit}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">
                Edit Booking{bookingNumber ? ` ${bookingNumber}` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-slate-400 hover:bg-surface"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label" htmlFor={`en-${id}`}>
                  Passenger name
                </label>
                <input
                  id={`en-${id}`}
                  className="field"
                  required
                  value={form.passenger_name}
                  onChange={(e) => set("passenger_name", e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor={`ep-${id}`}>
                  Phone
                </label>
                <input
                  id={`ep-${id}`}
                  className="field"
                  required
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor={`ee-${id}`}>
                  Email
                </label>
                <input
                  id={`ee-${id}`}
                  type="email"
                  className="field"
                  required
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor={`epu-${id}`}>
                  Pickup address
                </label>
                <input
                  id={`epu-${id}`}
                  className="field"
                  required
                  value={form.pickup_address}
                  onChange={(e) => set("pickup_address", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor={`ed-${id}`}>
                  Destination address
                </label>
                <input
                  id={`ed-${id}`}
                  className="field"
                  required
                  value={form.destination_address}
                  onChange={(e) => set("destination_address", e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor={`edt-${id}`}>
                  Ride date
                </label>
                <input
                  id={`edt-${id}`}
                  type="date"
                  className="field"
                  required
                  value={form.ride_date}
                  onChange={(e) => set("ride_date", e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor={`ett-${id}`}>
                  Ride time
                </label>
                <input
                  id={`ett-${id}`}
                  type="time"
                  className="field"
                  required
                  value={form.ride_time}
                  onChange={(e) => set("ride_time", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor={`eno-${id}`}>
                  Notes
                </label>
                <textarea
                  id={`eno-${id}`}
                  className="field"
                  rows={2}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-outline py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="btn-primary py-2 text-sm"
              >
                {pending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />{" "}
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
