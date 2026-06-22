import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const supabase = await createClient();
  const { data: leads } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold">Leads</h1>
      <p className="mt-1 text-slate-500">
        Unified pipeline from bookings, quotes, and contact forms.
      </p>

      <div className="card mt-6 overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase text-slate-400">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Contact</th>
              <th className="p-4">Source</th>
              <th className="p-4">Status</th>
              <th className="p-4">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!leads || leads.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400">
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
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {formatDateTime(l.created_at)}
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
