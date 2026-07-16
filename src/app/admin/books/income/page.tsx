import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/books/ledger";
import type {
  JournalEntry,
  JournalLine,
  LedgerAccount,
} from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";
import { IncomeForm } from "@/components/admin/books/IncomeForm";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const supabase = await createClient();
  const [entriesRes, accountsRes] = await Promise.all([
    supabase
      .from("journal_entries")
      .select("*")
      .eq("source_type", "income")
      .order("entry_date", { ascending: false })
      .order("entry_number", { ascending: false })
      .limit(50),
    supabase
      .from("ledger_accounts")
      .select("id, code, name, type, subtype")
      .eq("is_archived", false)
      .order("code"),
  ]);

  const entries = (entriesRes.data ?? []) as JournalEntry[];
  const accounts = (accountsRes.data ?? []) as Pick<
    LedgerAccount,
    "id" | "code" | "name" | "type" | "subtype"
  >[];

  // Amount per income entry = the debit side (deposit).
  const amounts = new Map<string, number>();
  if (entries.length > 0) {
    const { data: lines } = await supabase
      .from("journal_lines")
      .select("entry_id, debit_cents")
      .in(
        "entry_id",
        entries.map((e) => e.id),
      );
    for (const line of (lines ?? []) as Pick<
      JournalLine,
      "entry_id" | "debit_cents"
    >[]) {
      amounts.set(
        line.entry_id,
        (amounts.get(line.entry_id) ?? 0) + line.debit_cents,
      );
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[24rem_1fr]">
      <IncomeForm
        depositAccounts={accounts.filter(
          (a) => a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? ""),
        )}
        incomeAccounts={accounts.filter((a) => a.type === "income")}
      />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-600">
          Recorded income
        </h2>
        {entries.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-slate-700">No income recorded yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Record cash or check payments here. Stripe payments will flow in
              automatically once invoicing lands in phase 3.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Memo</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-slate-50 transition last:border-0 hover:bg-surface"
                >
                  <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                    {formatDate(entry.entry_date)}
                  </td>
                  <td className="px-5 py-3 text-slate-900">
                    {entry.memo ?? "Income"}
                  </td>
                  <td className="px-5 py-3 text-right font-medium tabular-nums text-emerald-600">
                    {formatMoney(amounts.get(entry.id) ?? 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
