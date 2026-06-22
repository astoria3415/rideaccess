import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .order("created_at", { ascending: false });

  const total =
    payments
      ?.filter((p) => p.status === "paid")
      .reduce((s, p) => s + (p.amount_cents ?? 0), 0) ?? 0;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="mt-1 text-slate-500">Stripe payment records.</p>
        </div>
        <div className="card px-5 py-3">
          <p className="text-xs uppercase text-slate-400">Total collected</p>
          <p className="font-heading text-2xl font-bold text-primary">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Description</th>
              <th className="p-4">Email</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!payments || payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400">
                  No payments yet.
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className="p-4 font-medium text-ink">{p.description}</td>
                  <td className="p-4 text-xs text-slate-600">{p.email}</td>
                  <td className="p-4 font-semibold text-primary">
                    {formatCurrency(p.amount_cents)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {formatDateTime(p.created_at)}
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
