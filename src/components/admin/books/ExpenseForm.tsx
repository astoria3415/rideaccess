"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Loader2, Paperclip, Sparkles, X } from "lucide-react";
import {
  createExpense,
  suggestExpenseCategory,
} from "@/app/admin/books/actions";
import { parseMoney } from "@/lib/books/ledger";
import { createClient } from "@/lib/supabase/client";

type AccountOption = { id: string; code: string; name: string };
type VendorOption = { id: string; name: string };

const NEW_VENDOR = "__new__";

export function ExpenseForm({
  categoryAccounts,
  paymentAccounts,
  vendors,
}: {
  categoryAccounts: AccountOption[];
  paymentAccounts: AccountOption[];
  vendors: VendorOption[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  const [expenseDate, setExpenseDate] = useState(today);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [newVendorName, setNewVendorName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function suggest() {
    if (!description.trim()) {
      setError("Type a description first, then I can suggest a category.");
      return;
    }
    setError(null);
    setSuggesting(true);
    try {
      const vendorName =
        vendorId === NEW_VENDOR
          ? newVendorName
          : (vendors.find((v) => v.id === vendorId)?.name ?? null);
      const result = await suggestExpenseCategory(description, vendorName);
      if (result) {
        setCategoryId(result.id);
        setSuggestion(`${result.code} · ${result.name}`);
      }
    } catch {
      setError("Could not get a suggestion. Pick a category manually.");
    } finally {
      setSuggesting(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cents = parseMoney(amount);
    if (cents === null || cents <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }
    if (!categoryId || !paymentId) {
      setError("Pick a category and how it was paid.");
      return;
    }

    setSubmitting(true);
    try {
      let receiptPath: string | null = null;
      if (receipt) {
        const supabase = createClient();
        const ext = receipt.name.split(".").pop()?.toLowerCase() || "jpg";
        receiptPath = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("receipts")
          .upload(receiptPath, receipt, { contentType: receipt.type });
        if (uploadError) {
          setError(`Receipt upload failed: ${uploadError.message}`);
          return;
        }
      }

      const result = await createExpense({
        expense_date: expenseDate,
        amount_cents: cents,
        description,
        vendor_id: vendorId && vendorId !== NEW_VENDOR ? vendorId : null,
        new_vendor_name: vendorId === NEW_VENDOR ? newVendorName : null,
        category_account_id: categoryId,
        payment_account_id: paymentId,
        receipt_path: receiptPath,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/books/expenses");
      router.refresh();
    } catch {
      setError("Something went wrong saving the expense. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-lg font-semibold text-slate-900">
        New expense
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-date" className="mb-1 block text-sm font-medium text-slate-700">
            Date <span aria-hidden="true" className="text-rose-500">*</span>
          </label>
          <input
            id="expense-date"
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="expense-amount" className="mb-1 block text-sm font-medium text-slate-700">
            Amount <span aria-hidden="true" className="text-rose-500">*</span>
          </label>
          <input
            id="expense-amount"
            inputMode="decimal"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} text-right tabular-nums`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="expense-description" className="mb-1 block text-sm font-medium text-slate-700">
          Description <span aria-hidden="true" className="text-rose-500">*</span>
        </label>
        <input
          id="expense-description"
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Shell fill-up for van #2"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="expense-vendor" className="mb-1 block text-sm font-medium text-slate-700">
            Vendor
          </label>
          <select
            id="expense-vendor"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">No vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
            <option value={NEW_VENDOR}>+ Add new vendor…</option>
          </select>
          {vendorId === NEW_VENDOR ? (
            <div className="mt-2">
              <label htmlFor="new-vendor-name" className="sr-only">
                New vendor name
              </label>
              <input
                id="new-vendor-name"
                type="text"
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="New vendor name"
                className={inputClass}
              />
            </div>
          ) : null}
        </div>
        <div>
          <label htmlFor="expense-payment" className="mb-1 block text-sm font-medium text-slate-700">
            Paid from <span aria-hidden="true" className="text-rose-500">*</span>
          </label>
          <select
            id="expense-payment"
            required
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            className={`${inputClass} bg-white`}
          >
            <option value="">Select account…</option>
            {paymentAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="expense-category" className="block text-sm font-medium text-slate-700">
            Category <span aria-hidden="true" className="text-rose-500">*</span>
          </label>
          <button
            type="button"
            onClick={suggest}
            disabled={suggesting}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-secondary transition hover:bg-cyan-50 disabled:opacity-50"
          >
            {suggesting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
            )}
            Suggest category
          </button>
        </div>
        <select
          id="expense-category"
          required
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setSuggestion(null);
          }}
          className={`${inputClass} bg-white`}
        >
          <option value="">Select category…</option>
          {categoryAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} · {a.name}
            </option>
          ))}
        </select>
        {suggestion ? (
          <p className="mt-1 text-xs text-secondary" aria-live="polite">
            Suggested: {suggestion}
          </p>
        ) : null}
      </div>

      <div>
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Receipt photo
        </span>
        {receipt ? (
          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-slate-700">
            <span className="truncate">{receipt.name}</span>
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              aria-label="Remove receipt"
              className="ml-2 rounded p-1 text-slate-400 transition hover:text-rose-600"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-500 transition hover:border-primary hover:text-primary">
            <Paperclip className="h-4 w-4" aria-hidden />
            Attach a photo or PDF (optional)
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
              capture="environment"
              className="sr-only"
              onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
            />
          </label>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Save expense
        </button>
      </div>
    </form>
  );
}
