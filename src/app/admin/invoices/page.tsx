import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { CreateInvoiceForm } from "@/components/admin/CreateInvoiceForm";
import { InvoiceActions } from "@/components/admin/InvoiceActions";
import type { Invoice } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function AdminInvoicesPage() {
  const supabase = await createClient();

  const [{ data: invoices }, { data: bookings }] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase
      .from("bookings")
      .select("id, passenger_name, email, service_type, ride_date")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const list = (invoices ?? []) as Invoice[];
  const totalBilled = list.reduce((s, i) => s + i.total_cents, 0);
  const totalPaid = list
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.total_cents, 0);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="mt-1 text-slate-500">
            Create, download, and email branded invoices to customers.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="card px-4 py-2 text-center">
            <p className="text-xs uppercase text-slate-400">Billed</p>
            <p className="font-heading text-lg font-bold text-primary">
              {formatCurrency(totalBilled)}
            </p>
          </div>
          <div className="card px-4 py-2 text-center">
            <p className="text-xs uppercase text-slate-400">Paid</p>
            <p className="font-heading text-lg font-bold text-success">
              {formatCurrency(totalPaid)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CreateInvoiceForm bookings={bookings ?? []} />
      </div>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Invoice #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Issued</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400">
                  No invoices yet. Create one above.
                </td>
              </tr>
            ) : (
              list.map((inv) => (
                <tr key={inv.id} className="align-top">
                  <td className="p-4 font-mono text-xs font-semibold text-primary">
                    {inv.invoice_number}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-ink">{inv.customer_name}</p>
                    {inv.customer_email && (
                      <p className="text-xs text-slate-500">{inv.customer_email}</p>
                    )}
                  </td>
                  <td className="p-4 text-slate-600">{formatDate(inv.issued_date)}</td>
                  <td className="p-4 font-semibold text-primary">
                    {formatCurrency(inv.total_cents)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-4">
                    <InvoiceActions
                      id={inv.id}
                      status={inv.status}
                      hasEmail={!!inv.customer_email}
                    />
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
