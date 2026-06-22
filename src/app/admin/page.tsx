import Link from "next/link";
import {
  CalendarDays,
  Users,
  MessageSquare,
  CreditCard,
  Clock,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

async function getStats() {
  const supabase = await createClient();

  const [bookings, pendingBookings, leads, contacts, payments, recent] =
    await Promise.all([
      supabase.from("bookings").select("id", { count: "exact", head: true }),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("booking_status", "pending"),
      supabase.from("leads").select("id", { count: "exact", head: true }),
      supabase
        .from("contact_requests")
        .select("id", { count: "exact", head: true }),
      supabase.from("payments").select("amount_cents").eq("status", "paid"),
      supabase
        .from("bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

  const revenue =
    payments.data?.reduce((sum, p) => sum + (p.amount_cents ?? 0), 0) ?? 0;

  return {
    totalBookings: bookings.count ?? 0,
    pendingBookings: pendingBookings.count ?? 0,
    leads: leads.count ?? 0,
    contacts: contacts.count ?? 0,
    revenue,
    recent: recent.data ?? [],
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Total Bookings", value: stats.totalBookings, icon: CalendarDays, href: "/admin/bookings" },
    { label: "Pending Rides", value: stats.pendingBookings, icon: Clock, href: "/admin/bookings" },
    { label: "Total Leads", value: stats.leads, icon: Users, href: "/admin/leads" },
    { label: "Contact Requests", value: stats.contacts, icon: MessageSquare, href: "/admin/contacts" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-slate-500">Overview of bookings, leads & revenue.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="card hover:shadow-card">
            <div className="flex items-center justify-between">
              <c.icon className="h-7 w-7 text-secondary" aria-hidden />
              <TrendingUp className="h-4 w-4 text-success" aria-hidden />
            </div>
            <p className="mt-4 font-heading text-3xl font-bold text-primary">
              {c.value}
            </p>
            <p className="text-sm text-slate-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-secondary" aria-hidden />
            <div>
              <p className="text-sm text-slate-500">Total Revenue (paid)</p>
              <p className="font-heading text-3xl font-bold text-primary">
                {formatCurrency(stats.revenue)}
              </p>
            </div>
          </div>
          <Link href="/admin/payments" className="btn-outline mt-4 w-full py-2 text-sm">
            View Payments
          </Link>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Bookings</h2>
            <Link href="/admin/bookings" className="text-sm font-semibold text-secondary">
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            {stats.recent.length === 0 ? (
              <p className="py-8 text-center text-slate-400">No bookings yet.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2">Passenger</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recent.map((b) => (
                    <tr key={b.id}>
                      <td className="py-3 font-medium text-ink">
                        {b.passenger_name}
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDate(b.ride_date)}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={b.booking_status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
