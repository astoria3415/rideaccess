"use client";

import { useState, useTransition } from "react";
import { Loader2, Eraser } from "lucide-react";
import { clearOldRows, type DeletableTable } from "@/app/admin/actions";

export function ClearOldData({
  table,
  note,
}: {
  table: Exclude<DeletableTable, "testimonials">;
  note?: string;
}) {
  const [days, setDays] = useState(90);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<string>("");
  const [pending, startTransition] = useTransition();

  function run() {
    setConfirming(false);
    startTransition(async () => {
      try {
        const deleted = await clearOldRows(table, days);
        setResult(`Deleted ${deleted} record${deleted === 1 ? "" : "s"}.`);
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <select
        value={days}
        onChange={(e) => {
          setDays(Number(e.target.value));
          setConfirming(false);
        }}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
        aria-label="Delete records older than"
      >
        <option value={30}>Older than 30 days</option>
        <option value={60}>Older than 60 days</option>
        <option value={90}>Older than 90 days</option>
      </select>
      {confirming ? (
        <>
          <button
            type="button"
            onClick={run}
            className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Confirm delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancel
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setResult("");
            setConfirming(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Eraser className="h-4 w-4" aria-hidden />
          )}
          Clear old records
        </button>
      )}
      {result && <span className="text-xs text-slate-500">{result}</span>}
      {note && !result && !confirming && (
        <span className="text-xs text-slate-400">{note}</span>
      )}
    </div>
  );
}
