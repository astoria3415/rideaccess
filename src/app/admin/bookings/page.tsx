import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { BookingStatusSelect } from "@/components/admin/BookingStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Bookings</h1>
      <p className="mt-1 text-slate-500">
        Manage ride requests and update their status.
      </p>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[840px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Passenger</th>
              <th className="p-4">Trip</th>
              <th className="p-4">When</th>
              <th className="p-4">WC</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!bookings || bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="p-4">
                    <p className="font-medium text-ink">{b.passenger_name}</p>
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
                  </td>
                  <td className="p-4">
                    <BookingStatusSelect id={b.id} current={b.booking_status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
