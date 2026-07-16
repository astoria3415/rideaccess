"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { postJournalEntry } from "@/app/admin/books/actions";
import {
  formatMoney,
  parseMoney,
  validateEntry,
  type LedgerLine,
} from "@/lib/books/ledger";
import type { LedgerAccount } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type AccountOption = Pick<LedgerAccount, "id" | "code" | "name" | "type">;

type FormLine = {
  key: number;
  account_id: string;
  debit: string;
  credit: string;
  description: string;
};

let nextKey = 2;

function emptyLine(): FormLine {
  return { key: nextKey++, account_id: "", debit: "", credit: "", description: "" };
}

function toCents(value: string): number {
  if (!value.trim()) return 0;
  return parseMoney(value) ?? NaN;
}

export function JournalEntryForm({ accounts }: { accounts: AccountOption[] }) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const [entryDate, setEntryDate] = useState(today);
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState<FormLine[]>([
    { key: 0, account_id: "", debit: "", credit: "", description: "" },
    { key: 1, account_id: "", debit: "", credit: "", description: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    let debits = 0;
    let credits = 0;
    for (const line of lines) {
      const d = toCents(line.debit);
      const c = toCents(line.credit);
      if (!Number.isNaN(d)) debits += d;
      if (!Number.isNaN(c)) credits += c;
    }
    return { debits, credits, balanced: debits === credits && debits > 0 };
  }, [lines]);

  function updateLine(key: number, patch: Partial<FormLine>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l)),
    );
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const ledgerLines: LedgerLine[] = lines.map((l) => ({
      account_id: l.account_id,
      debit_cents: toCents(l.debit),
      credit_cents: toCents(l.credit),
      description: l.description.trim() || null,
    }));

    if (ledgerLines.some((l) => Number.isNaN(l.debit_cents) || Number.isNaN(l.credit_cents))) {
      setError("One or more amounts are not valid dollar values.");
      return;
    }
    const validation = validateEntry(ledgerLines);
    if (validation.length > 0) {
      setError(validation.map((e) => e.message).join(" "));
      return;
    }

    setSubmitting(true);
    try {
      const result = await postJournalEntry({
        entry_date: entryDate,
        memo,
        lines: ledgerLines,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/admin/books/journal");
      router.refresh();
    } catch {
      setError("Something went wrong posting the entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-lg font-semibold text-slate-900">
        New journal entry
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="entry-date"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Date <span aria-hidden="true" className="text-rose-500">*</span>
          </label>
          <input
            id="entry-date"
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label
            htmlFor="entry-memo"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Memo
          </label>
          <input
            id="entry-memo"
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Opening balance for checking"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-slate-700">Lines</legend>
        {lines.map((line, index) => (
          <div
            key={line.key}
            className="grid grid-cols-1 gap-2 rounded-xl border border-slate-100 bg-surface/60 p-3 sm:grid-cols-[1fr_7rem_7rem_auto]"
          >
            <div>
              <label htmlFor={`account-${line.key}`} className="sr-only">
                Account for line {index + 1}
              </label>
              <select
                id={`account-${line.key}`}
                value={line.account_id}
                onChange={(e) =>
                  updateLine(line.key, { account_id: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Select account…</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} · {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`debit-${line.key}`} className="sr-only">
                Debit amount for line {index + 1}
              </label>
              <input
                id={`debit-${line.key}`}
                inputMode="decimal"
                placeholder="Debit"
                value={line.debit}
                onChange={(e) =>
                  updateLine(line.key, { debit: e.target.value, credit: "" })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label htmlFor={`credit-${line.key}`} className="sr-only">
                Credit amount for line {index + 1}
              </label>
              <input
                id={`credit-${line.key}`}
                inputMode="decimal"
                placeholder="Credit"
                value={line.credit}
                onChange={(e) =>
                  updateLine(line.key, { credit: e.target.value, debit: "" })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm tabular-nums focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                setLines((prev) =>
                  prev.length > 2
                    ? prev.filter((l) => l.key !== line.key)
                    : prev,
                )
              }
              disabled={lines.length <= 2}
              aria-label={`Remove line ${index + 1}`}
              className="flex h-10 w-10 items-center justify-center self-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setLines((prev) => [...prev, emptyLine()])}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-surface"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add line
        </button>
      </fieldset>

      <div
        className={cn(
          "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium tabular-nums",
          totals.balanced
            ? "bg-emerald-50 text-emerald-700"
            : "bg-surface text-slate-600",
        )}
        aria-live="polite"
      >
        <span>Debits: {formatMoney(totals.debits)}</span>
        <span>Credits: {formatMoney(totals.credits)}</span>
        <span>
          {totals.balanced
            ? "Balanced"
            : `Off by ${formatMoney(Math.abs(totals.debits - totals.credits))}`}
        </span>
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
          disabled={submitting || !totals.balanced}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : null}
          Post entry
        </button>
      </div>
    </form>
  );
}
