"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingStatusSelect } from "@/components/admin/BookingStatusSelect";
import { SendPaymentRequest } from "@/components/admin/SendPaymentRequest";
import { EditBookingDialog } from "@/components/admin/EditBookingDialog";
import { DeleteButton } from "@/components/admin/DeleteButton";

type Booking = {
  id: string;
  booking_number: string | null;
  passenger_name: string;
  phone: string;
  email: string;
  pickup_address: string;
  destination_address: string;
  service_type: string | null;
  ride_date: string;
  ride_time: string;
  wheelchair_required: boolean;
  notes: string | null;
  payment_status: string;
  booking_status: string;
};

const STATUSES = [
  "all",
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return bookings.filter((b) => {
      if (status !== "all" && b.booking_status !== status) return false;
      if (!needle) return true;
      return [
        b.passenger_name,
        b.booking_number ?? "",
        b.email,
        b.phone,
        b.pickup_address,
        b.destination_address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [bookings, q, status]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, number, address…"
            aria-label="Search bookings"
            className="w-64 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-secondary focus:outline-none"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm capitalize"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-400">
          {filtered.length} of {bookings.length}
        </span>
      </div>

      <div className="card mt-4 overflow-x-auto p-0">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Passenger</th>
              <th className="p-4">Trip</th>
              <th className="p-4">When</th>
              <th className="p-4">WC</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-slate-400">
                  {bookings.length === 0
                    ? "No bookings yet."
                    : "No bookings match your search."}
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="p-4">
                    <p className="font-medium text-ink">{b.passenger_name}</p>
                    {b.booking_number && (
                      <p className="text-xs font-semibold text-primary">
                        {b.booking_number}
                      </p>
                    )}
                    <p className="text-xs text-slate-500">{b.phone}</p>
                    <p className="text-xs text-slate-500">{b.email}</p>
                  </td>
                  <td className="p-4 text-xs text-slate-600">
                    <p>
                      <span className="font-semibold">From:</span>{" "}
                      {b.pickup_address}
                    </p>
                    <p>
                      <span className="font-semibold">To:</span>{" "}
                      {b.destination_address}
                    </p>
                    <p className="mt-1 text-slate-400">{b.service_type}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    {formatDate(b.ride_date)}
                    <br />
                    <span className="text-xs text-slate-400">{b.ride_time}</span>
                  </td>
                  <td className="p-4">
                    {b.wheelchair_required ? (
                      <span className="text-success">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={b.payment_status} />
                    {b.payment_status !== "paid" && (
                      <div className="mt-2">
                        <SendPaymentRequest bookingId={b.id} />
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <BookingStatusSelect id={b.id} current={b.booking_status} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <EditBookingDialog
                        id={b.id}
                        bookingNumber={b.booking_number}
                        booking={{
                          passenger_name: b.passenger_name,
                          phone: b.phone,
                          email: b.email,
                          pickup_address: b.pickup_address,
                          destination_address: b.destination_address,
                          ride_date: b.ride_date,
                          ride_time: b.ride_time,
                          notes: b.notes,
                        }}
                      />
                      <DeleteButton
                        table="bookings"
                        id={b.id}
                        label={`booking ${b.booking_number ?? ""}`}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
