"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Mail, Trash2, Loader2, Link2 } from "lucide-react";
import {
  emailInvoice,
  setInvoiceStatus,
  deleteInvoice,
  createInvoicePaymentLink,
} from "@/app/admin/invoices/actions";
import type { InvoiceStatus } from "@/lib/supabase/types";

const STATUSES: InvoiceStatus[] = ["draft", "sent", "paid"];

export function InvoiceActions({
  id,
  status,
  hasEmail,
}: {
  id: string;
  status: InvoiceStatus;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emailing, setEmailing] = useState(false);
  const [linking, setLinking] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  async function onPaymentLink() {
    setLinking(true);
    setToast(null);
    const res = await createInvoicePaymentLink(id);
    if (res.ok) {
      try {
        await navigator.clipboard.writeText(res.url);
        setToast({ ok: true, msg: "Payment link copied to clipboard." });
      } catch {
        window.open(res.url, "_blank", "noopener,noreferrer");
        setToast({ ok: true, msg: "Payment link opened in a new tab." });
      }
    } else {
      setToast({ ok: false, msg: res.message });
    }
    setLinking(false);
    setTimeout(() => setToast(null), 6000);
  }

  async function onEmail() {
    setEmailing(true);
    setToast(null);
    const res = await emailInvoice(id);
    setToast({ ok: res.ok, msg: res.message });
    setEmailing(false);
    if (res.ok) router.refresh();
    setTimeout(() => setToast(null), 6000);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={`/api/admin/invoices/${id}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink hover:border-secondary hover:text-primary"
      >
        <Download className="h-4 w-4" /> PDF
      </a>

      <button
        onClick={onEmail}
        disabled={emailing || !hasEmail}
        title={hasEmail ? "Email this invoice to the customer" : "No customer email on file"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink hover:border-secondary hover:text-primary disabled:opacity-50"
      >
        {emailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Email
      </button>

      <button
        onClick={onPaymentLink}
        disabled={linking || status === "paid"}
        title={
          status === "paid"
            ? "Invoice is already paid"
            : "Create a Stripe payment link and copy it"
        }
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-ink hover:border-secondary hover:text-primary disabled:opacity-50"
      >
        {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
        Pay link
      </button>

      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) =>
          startTransition(async () => {
            await setInvoiceStatus(id, e.target.value as InvoiceStatus);
            router.refresh();
          })
        }
        className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-medium capitalize focus:border-secondary focus:outline-none"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <button
        onClick={() => {
          if (!confirm("Delete this invoice? This cannot be undone.")) return;
          startTransition(async () => {
            await deleteInvoice(id);
            router.refresh();
          });
        }}
        aria-label="Delete invoice"
        className="rounded-lg border border-slate-300 p-1.5 text-slate-400 hover:border-rose-300 hover:text-rose-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {toast && (
        <span className={`text-xs ${toast.ok ? "text-emerald-600" : "text-rose-600"}`}>
          {toast.msg}
        </span>
      )}
    </div>
  );
}
