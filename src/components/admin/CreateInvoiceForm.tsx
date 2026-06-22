"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, FileText, X } from "lucide-react";
import { createInvoice } from "@/app/admin/invoices/actions";

interface BookingOption {
  id: string;
  passenger_name: string;
  email: string;
  service_type: string;
  ride_date: string;
}

interface Row {
  description: string;
  quantity: number;
  unit: string; // dollars, as typed
}

const blankRow = (): Row => ({ description: "", quantity: 1, unit: "" });

export function CreateInvoiceForm({ bookings }: { bookings: BookingOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [taxDollars, setTaxDollars] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [rows, setRows] = useState<Row[]>([blankRow()]);

  function prefillFromBooking(id: string) {
    setBookingId(id);
    const b = bookings.find((x) => x.id === id);
    if (b) {
      setCustomerName(b.passenger_name);
      setCustomerEmail(b.email);
      setRows([{ description: b.service_type, quantity: 1, unit: "" }]);
    }
  }

  const subtotal = rows.reduce(
    (s, r) => s + (parseFloat(r.unit) || 0) * Math.max(1, r.quantity),
    0,
  );
  const tax = parseFloat(taxDollars) || 0;
  const total = subtotal + tax;

  function reset() {
    setCustomerName("");
    setCustomerEmail("");
    setBookingId("");
    setTaxDollars("");
    setNotes("");
    setDueDate("");
    setRows([blankRow()]);
    setError("");
  }

  function submit() {
    setError("");
    const lineItems = rows
      .filter((r) => r.description.trim() && parseFloat(r.unit) > 0)
      .map((r) => ({
        description: r.description.trim(),
        quantity: Math.max(1, Math.round(r.quantity)),
        unit_cents: Math.round(parseFloat(r.unit) * 100),
      }));
    if (!customerName.trim()) return setError("Customer name is required.");
    if (lineItems.length === 0)
      return setError("Add at least one line item with an amount.");

    startTransition(async () => {
      try {
        await createInvoice({
          customerName,
          customerEmail: customerEmail || undefined,
          bookingId: bookingId || null,
          lineItems,
          taxCents: Math.round(tax * 100),
          notes: notes || undefined,
          dueDate: dueDate || null,
        });
        reset();
        setOpen(false);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create invoice.");
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        <FileText className="h-5 w-5" aria-hidden /> Create Invoice
      </button>
    );
  }

  return (
    <div className="card mt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">New Invoice</h2>
        <button onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>

      {bookings.length > 0 && (
        <div className="mt-4">
          <label className="label">Prefill from a booking (optional)</label>
          <select
            className="field"
            value={bookingId}
            onChange={(e) => prefillFromBooking(e.target.value)}
          >
            <option value="">— None (custom invoice) —</option>
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.passenger_name} · {b.service_type} · {b.ride_date}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Customer Name *</label>
          <input className="field" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
        </div>
        <div>
          <label className="label">Customer Email</label>
          <input className="field" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
        </div>
      </div>

      {/* Line items */}
      <div className="mt-5">
        <label className="label">Line Items</label>
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_4rem_6rem_2rem] items-center gap-2">
              <input
                className="field py-2"
                placeholder="Description"
                value={row.description}
                onChange={(e) =>
                  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, description: e.target.value } : r)))
                }
              />
              <input
                className="field py-2 text-center"
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) =>
                  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, quantity: parseInt(e.target.value) || 1 } : r)))
                }
              />
              <input
                className="field py-2"
                type="number"
                min={0}
                step="0.01"
                placeholder="$ unit"
                value={row.unit}
                onChange={(e) =>
                  setRows((rs) => rs.map((r, j) => (j === i ? { ...r, unit: e.target.value } : r)))
                }
              />
              <button
                type="button"
                aria-label="Remove line"
                onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, j) => j !== i) : rs))}
                className="text-slate-400 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((rs) => [...rs, blankRow()])}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-secondary"
        >
          <Plus className="h-4 w-4" /> Add line item
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label">Tax ($)</label>
          <input className="field" type="number" min={0} step="0.01" value={taxDollars} onChange={(e) => setTaxDollars(e.target.value)} />
        </div>
        <div>
          <label className="label">Due Date</label>
          <input className="field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-sm text-slate-500">Total</p>
          <p className="font-heading text-2xl font-bold text-primary">
            ${total.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="label">Notes</label>
        <textarea className="field min-h-[70px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

      <div className="mt-5 flex gap-3">
        <button onClick={submit} disabled={pending} className="btn-primary">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
          Create Invoice
        </button>
        <button onClick={() => setOpen(false)} className="btn-outline">
          Cancel
        </button>
      </div>
    </div>
  );
}
