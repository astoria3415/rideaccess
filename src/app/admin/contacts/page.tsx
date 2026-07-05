import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ClearOldData } from "@/components/admin/ClearOldData";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  const supabase = await createClient();
  const { data: contacts } = await supabase
    .from("contact_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contact Requests</h1>
          <p className="mt-1 text-slate-500">
            Messages submitted via the website.
          </p>
        </div>
        <ClearOldData table="contact_requests" />
      </div>

      <div className="mt-6 grid gap-4">
        {!contacts || contacts.length === 0 ? (
          <p className="card p-10 text-center text-slate-400">
            No contact requests yet.
          </p>
        ) : (
          contacts.map((c) => (
            <div key={c.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-ink">{c.subject}</p>
                  <p className="text-sm text-slate-500">
                    {c.name} · {c.email} · {c.phone}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <span className="text-xs text-slate-400">
                    {formatDateTime(c.created_at)}
                  </span>
                  <DeleteButton
                    table="contact_requests"
                    id={c.id}
                    label="contact request"
                  />
                </div>
              </div>
              <p className="mt-3 rounded-xl bg-surface p-4 text-sm leading-relaxed text-slate-700">
                {c.message}
              </p>
              <a
                href={`mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject)}`}
                className="btn-outline mt-3 py-2 text-sm"
              >
                Reply by Email
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
