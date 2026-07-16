import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  Plus,
  Scale,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  accountBalance,
  formatMoney,
  profitAndLoss,
  trialBalance,
  type LedgerAccountRef,
} from "@/lib/books/ledger";
import type { JournalEntry, JournalLine, LedgerAccount } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getBooksData() {
  const supabase = await createClient();
  const [accountsRes, entriesRes, linesRes] = await Promise.all([
    supabase
      .from("ledger_accounts")
      .select("*")
      .eq("is_archived", false)
      .order("code"),
    supabase
      .from("journal_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("entry_number", { ascending: false })
      .limit(8),
    supabase.from("journal_lines").select("*"),
  ]);

  const accounts = (accountsRes.data ?? []) as LedgerAccount[];
  const recentEntries = (entriesRes.data ?? []) as JournalEntry[];
  const lines = (linesRes.data ?? []) as JournalLine[];

  // Entry dates for month-to-date filtering.
  const { data: allEntries } = await supabase
    .from("journal_entries")
    .select("id, entry_date");
  const entryDate = new Map(
    (allEntries ?? []).map((e) => [e.id as string, e.entry_date as string]),
  );

  return { accounts, recentEntries, lines, entryDate };
}

export default async function BooksOverview() {
  const { accounts, recentEntries, lines, entryDate } = await getBooksData();

  const refs: LedgerAccountRef[] = accounts.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    type: a.type,
  }));

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const mtdLines = lines.filter(
    (l) => (entryDate.get(l.entry_id) ?? "") >= monthStart,
  );

  const mtd = profitAndLoss(trialBalance(refs, mtdLines).rows);

  // Cash position: all-time balance of cash/bank asset accounts.
  const cashIds = new Set(
    accounts
      .filter((a) => a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? ""))
      .map((a) => a.id),
  );
  let cashDebits = 0;
  let cashCredits = 0;
  for (const l of lines) {
    if (cashIds.has(l.account_id)) {
      cashDebits += l.debit_cents;
      cashCredits += l.credit_cents;
    }
  }
  const cash = accountBalance("asset", cashDebits, cashCredits);

  const cards = [
    {
      label: "Income (this month)",
      value: formatMoney(mtd.income_cents),
      icon: ArrowUpRight,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Expenses (this month)",
      value: formatMoney(mtd.expense_cents),
      icon: ArrowDownRight,
      tone: "text-rose-600 bg-rose-50",
    },
    {
      label: "Net profit (this month)",
      value: formatMoney(mtd.net_cents),
      icon: Scale,
      tone: "text-primary bg-blue-50",
    },
    {
      label: "Cash & bank",
      value: formatMoney(cash),
      icon: Landmark,
      tone: "text-secondary bg-cyan-50",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}
              >
                <card.icon className="h-5 w-5" aria-hidden />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-slate-900">
            Recent journal entries
          </h2>
          <Link
            href="/admin/books/journal/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden /> New entry
          </Link>
        </div>
        {recentEntries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-slate-700">No entries yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Your ledger is ready with a chart of accounts tailored to NEMT
              operations. Post your first journal entry — for example, record
              opening balances for your checking account.
            </p>
            <Link
              href="/admin/books/journal/new"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" aria-hidden /> Post first entry
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Memo</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-50 transition hover:bg-surface"
                  >
                    <td className="px-5 py-3 tabular-nums text-slate-500">
                      {entry.entry_number}
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {formatDate(entry.entry_date)}
                    </td>
                    <td className="px-5 py-3 text-slate-900">
                      {entry.memo ?? "—"}
                    </td>
                    <td className="px-5 py-3 capitalize text-slate-500">
                      {entry.source_type.replace("_", " ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
