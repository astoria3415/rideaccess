"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { FileUp, Loader2, Upload } from "lucide-react";
import { importBankTransactions } from "@/app/admin/books/actions";
import { parseBankCsv, type ParsedBankRow } from "@/lib/books/bank-import";
import { formatMoney } from "@/lib/books/ledger";

type AccountOption = { id: string; code: string; name: string };

export function BankImport({ bankAccounts }: { bankAccounts: AccountOption[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accountId, setAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedBankRow[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [columns, setColumns] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  function reset() {
    setRows([]);
    setSkipped([]);
    setColumns(null);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onFile(file: File | null) {
    setError(null);
    setResult(null);
    if (!file) return;
    const text = await file.text();
    const parsed = parseBankCsv(text);
    if ("error" in parsed) {
      reset();
      setError(parsed.error);
      return;
    }
    setFileName(file.name);
    setRows(parsed.rows);
    setSkipped(parsed.skipped);
    setColumns(
      `Date: ${parsed.columns.date} · Description: ${parsed.columns.description} · Amount: ${parsed.columns.amount}`,
    );
  }

  async function onImport() {
    if (rows.length === 0 || !accountId) return;
    setImporting(true);
    setError(null);
    try {
      const res = await importBankTransactions({ account_id: accountId, rows });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(
        `Imported ${res.inserted} transaction${res.inserted === 1 ? "" : "s"}` +
          (res.duplicates > 0
            ? `; skipped ${res.duplicates} already-imported duplicate${res.duplicates === 1 ? "" : "s"}.`
            : "."),
      );
      reset();
      router.refresh();
    } catch {
      setError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const totalIn = rows.filter((r) => r.amount_cents > 0).reduce((s, r) => s + r.amount_cents, 0);
  const totalOut = rows.filter((r) => r.amount_cents < 0).reduce((s, r) => s + r.amount_cents, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="font-heading text-lg font-semibold text-slate-900">
        Import bank statement (CSV)
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Export a CSV from your bank and drop it here. Duplicates from earlier
        imports are detected and skipped automatically.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="bank-account" className="mb-1 block text-sm font-medium text-slate-700">
            Statement account
          </label>
          <select
            id="bank-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {bankAccounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.code} · {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 transition hover:border-primary hover:text-primary">
            <FileUp className="h-4 w-4" aria-hidden />
            {fileName ?? "Choose CSV file"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3 rounded-xl bg-surface/70 p-4 text-sm">
          <p className="font-medium text-slate-800">
            {rows.length} transactions ready — money in{" "}
            <span className="tabular-nums text-emerald-600">{formatMoney(totalIn)}</span>, money out{" "}
            <span className="tabular-nums text-rose-600">{formatMoney(Math.abs(totalOut))}</span>
          </p>
          {columns ? <p className="text-xs text-slate-500">Detected columns — {columns}</p> : null}
          {skipped.length > 0 ? (
            <details className="text-xs text-amber-700">
              <summary className="cursor-pointer">
                {skipped.length} row{skipped.length === 1 ? "" : "s"} skipped
              </summary>
              <ul className="mt-1 list-inside list-disc">
                {skipped.slice(0, 10).map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </details>
          ) : null}
          <button
            type="button"
            onClick={onImport}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Upload className="h-4 w-4" aria-hidden />
            )}
            Import {rows.length} transactions
          </button>
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {result ? (
        <p aria-live="polite" className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {result}
        </p>
      ) : null}
    </section>
  );
}
