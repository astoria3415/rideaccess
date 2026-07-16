"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { recordIncome } from "@/app/admin/books/actions";
import { parseMoney } from "@/lib/books/ledger";

type AccountOption = { id: string; code: string; name: string };

export function IncomeForm({
  depositAccounts,
  incomeAccounts,
}: {
  depositAccounts: AccountOption[];
  incomeAccounts: AccountOption[];
}) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [entryDate, setEntryDate] = useState(today);
  const [payer, setPayer] = useState("");
  const [memo, setMemo] = useState("");
  const [amount, setAmount] = useState("");
  const [depositId, setDepositId] = useState(depositAccounts[0]?.id ?? "");
  const [incomeId, setIncomeId] = useState(incomeAccounts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const cents = parseMoney(amount);
    if (cents === null || cents <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await recordIncome({
        entry_date: entryDate,
        amount_cents: cents,
        payer,
        memo,
        deposit_account_id: depositId,
        income_account_id: incomeId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPayer("");
      setMemo("");
      setAmount("");
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong recording the income. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form
      onSubmit={onSubmit}
      className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-lg font-semibold text-slate-900">
        Record income
      </h2>

      <div>
        <label htmlFor="income-date" className="mb-1 block text-sm font-medium text-slate-700">
          Date <span aria-hidden="true" className="text-rose-500">*</span>
        </label>
        <input
          id="income-date"
          type="date"
          required
          value={entryDate}
          onChange={(e) => setEntryDate(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="income-amount" className="mb-1 block text-sm font-medium text-slate-700">
          Amount <span aria-hidden="true" className="text-rose-500">*</span>
        </label>
        <input
          id="income-amount"
          inputMode="decimal"
          required
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`${inputClass} text-right tabular-nums`}
        />
      </div>

      <div>
        <label htmlFor="income-payer" className="mb-1 block text-sm font-medium text-slate-700">
          Received from
        </label>
        <input
          id="income-payer"
          type="text"
          value={payer}
          onChange={(e) => setPayer(e.target.value)}
          placeholder="e.g. Sunrise Rehab Center"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="income-deposit" className="mb-1 block text-sm font-medium text-slate-700">
          Deposit to <span aria-hidden="true" className="text-rose-500">*</span>
        </label>
        <select
          id="income-deposit"
          required
          value={depositId}
          onChange={(e) => setDepositId(e.target.value)}
          className={`${inputClass} bg-white`}
        >
          {depositAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} · {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="income-account" className="mb-1 block text-sm font-medium text-slate-700">
          Income type <span aria-hidden="true" className="text-rose-500">*</span>
        </label>
        <select
          id="income-account"
          required
          value={incomeId}
          onChange={(e) => setIncomeId(e.target.value)}
          className={`${inputClass} bg-white`}
        >
          {incomeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} · {a.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="income-memo" className="mb-1 block text-sm font-medium text-slate-700">
          Memo
        </label>
        <input
          id="income-memo"
          type="text"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="e.g. Weekly dialysis contract"
          className={inputClass}
        />
      </div>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p aria-live="polite" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Income recorded.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        Record income
      </button>
    </form>
  );
}
