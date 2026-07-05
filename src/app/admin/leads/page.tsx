import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { LeadStatusSelect } from "@/components/admin/LeadStatusSelect";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ClearOldData } from "@/components/admin/ClearOldData";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="mt-1 text-slate-500">
            Unified pipeline from bookings, quotes, and contact forms.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/admin/export?table=leads"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-secondary hover:text-secondary"
          >
            <Download className="h-4 w-4" aria-hidden /> Export CSV
          </a>
          <ClearOldData table="leads" />
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Source</th>
              <th className="p-4">Status</th>
              <th className="p-4">Received</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!leads || leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-10 text-center text-slate-400">
                  No leads yet.
                </td>
              </tr>
            ) : (
              leads.map((l) => (
                <tr key={l.id}>
                  <td className="p-4 font-medium text-ink">{l.name}</td>
                  <td className="p-4 text-xs text-slate-600">
                    {l.email}
                    <br />
                    {l.phone}
                  </td>
                  <td className="p-4 capitalize text-slate-600">{l.source}</td>
                  <td className="p-4">
                    <LeadStatusSelect id={l.id} current={l.status} />
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {formatDateTime(l.created_at)}
                  </td>
                  <td className="p-4">
                    <DeleteButton table="leads" id={l.id} label="lead" />
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
