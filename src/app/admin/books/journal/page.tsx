import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/books/ledger";
import type {
  JournalEntry,
  JournalLine,
  LedgerAccount,
} from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const supabase = await createClient();
  const [entriesRes, linesRes, accountsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("entry_number", { ascending: false })
      .limit(50),
    supabase.from("journal_lines").select("*"),
    supabase.from("ledger_accounts").select("id, code, name"),
  ]);

  const entries = (entriesRes.data ?? []) as JournalEntry[];
  const lines = (linesRes.data ?? []) as JournalLine[];
  const accountName = new Map(
    ((accountsRes.data ?? []) as Pick<LedgerAccount, "id" | "code" | "name">[]).map(
      (a) => [a.id, `${a.code} · ${a.name}`],
    ),
  );

  const linesByEntry = new Map<string, JournalLine[]>();
  for (const line of lines) {
    const list = linesByEntry.get(line.entry_id) ?? [];
    list.push(line);
    linesByEntry.set(line.entry_id, list);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {entries.length === 0
            ? "No journal entries yet."
            : `Showing the ${entries.length} most recent entries.`}
        </p>
        <Link
          href="/admin/books/journal/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden /> New entry
        </Link>
      </div>

      {entries.map((entry) => {
        const entryLines = linesByEntry.get(entry.id) ?? [];
        const total = entryLines.reduce((s, l) => s + l.debit_cents, 0);
        return (
          <article
            key={entry.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-surface px-2 py-1 font-mono text-xs text-slate-500">
                  #{entry.entry_number}
                </span>
                <span className="text-sm font-medium text-slate-900">
                  {entry.memo ?? "Journal entry"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span>{formatDate(entry.entry_date)}</span>
                <span className="font-medium tabular-nums text-slate-900">
                  {formatMoney(total)}
                </span>
              </div>
            </header>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-50 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-2 font-medium">Account</th>
                  <th className="px-5 py-2 text-right font-medium">Debit</th>
                  <th className="px-5 py-2 text-right font-medium">Credit</th>
                </tr>
              </thead>
              <tbody>
                {entryLines.map((line) => (
                  <tr key={line.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-2 text-slate-700">
                      {accountName.get(line.account_id) ?? "Unknown account"}
                      {line.description ? (
                        <span className="ml-2 text-xs text-slate-400">
                          {line.description}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-slate-900">
                      {line.debit_cents > 0 ? formatMoney(line.debit_cents) : ""}
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums text-slate-900">
                      {line.credit_cents > 0 ? formatMoney(line.credit_cents) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
        );
      })}
    </div>
  );
}
