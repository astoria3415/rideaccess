import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingsTable } from "@/components/admin/BookingsTable";
import { ClearOldData } from "@/components/admin/ClearOldData";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="mt-1 text-slate-500">
            Manage ride requests and update their status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/export?table=bookings"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-secondary hover:text-secondary"
          >
            <Download className="h-4 w-4" aria-hidden /> Export CSV
          </a>
          <ClearOldData
            table="bookings"
            note="Only completed / cancelled rides are removed."
          />
        </div>
      </div>

      <BookingsTable bookings={bookings ?? []} />
    </div>
  );
}
