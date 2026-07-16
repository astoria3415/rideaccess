"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, EyeOff, Loader2 } from "lucide-react";
import {
  categorizeBankTransaction,
  excludeBankTransaction,
  matchBankTransaction,
} from "@/app/admin/books/actions";
import type { MatchCandidate } from "@/lib/books/bank-import";
import { formatMoney } from "@/lib/books/ledger";
import type { BankTransaction } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

type AccountOption = { id: string; code: string; name: string; type: string };

export function BankTxnRow({
  txn,
  accountLabel,
  matches,
  categoryAccounts,
}: {
  txn: BankTransaction;
  accountLabel: string;
  matches: MatchCandidate[];
  categoryAccounts: AccountOption[];
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relevantCategories = categoryAccounts.filter((a) =>
    txn.amount_cents < 0 ? a.type === "expense" : a.type === "income",
  );

  async function run(kind: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(kind);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setError(("error" in res && res.error) || "Action failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <li className="space-y-2 px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">{txn.description}</p>
          <p className="text-xs text-slate-500">
            {formatDate(txn.txn_date)} · {accountLabel}
          </p>
        </div>
        <span
          className={`shrink-0 font-semibold tabular-nums ${
            txn.amount_cents < 0 ? "text-rose-600" : "text-emerald-600"
          }`}
        >
          {txn.amount_cents < 0 ? "−" : "+"}
          {formatMoney(Math.abs(txn.amount_cents))}
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">Possible match:</span>
          {matches.map((m) => (
            <button
              key={m.entry_id}
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run(`match-${m.entry_id}`, () =>
                  matchBankTransaction(txn.id, m.entry_id),
                )
              }
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
            >
              {busy === `match-${m.entry_id}` ? (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              ) : (
                <Check className="h-3 w-3" aria-hidden />
              )}
              #{m.entry_number} {m.memo ? `— ${m.memo.slice(0, 40)}` : ""} (
              {formatDate(m.entry_date)})
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`cat-${txn.id}`} className="sr-only">
          Category for {txn.description}
        </label>
        <select
          id={`cat-${txn.id}`}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">
            {txn.amount_cents < 0 ? "Categorize as expense…" : "Categorize as income…"}
          </option>
          {relevantCategories.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} · {a.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!categoryId || busy !== null}
          onClick={() =>
            run("categorize", () => categorizeBankTransaction(txn.id, categoryId))
          }
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-40"
        >
          {busy === "categorize" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : null}
          Add to books
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => run("exclude", () => excludeBankTransaction(txn.id))}
          title="Exclude (personal or transfer — keep out of the books)"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-surface disabled:opacity-40"
        >
          {busy === "exclude" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <EyeOff className="h-3.5 w-3.5" aria-hidden />
          )}
          Exclude
        </button>
      </div>

      {error ? (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </li>
  );
}
