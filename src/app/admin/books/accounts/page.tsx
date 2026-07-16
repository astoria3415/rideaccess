import { createClient } from "@/lib/supabase/server";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPE_ORDER,
  accountBalance,
  formatMoney,
} from "@/lib/books/ledger";
import type { JournalLine, LedgerAccount } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ChartOfAccountsPage() {
  const supabase = await createClient();
  const [accountsRes, linesRes] = await Promise.all([
    supabase
      .from("ledger_accounts")
      .select("*")
      .eq("is_archived", false)
      .order("code"),
    supabase.from("journal_lines").select("account_id, debit_cents, credit_cents"),
  ]);

  const accounts = (accountsRes.data ?? []) as LedgerAccount[];
  const lines = (linesRes.data ?? []) as Pick<
    JournalLine,
    "account_id" | "debit_cents" | "credit_cents"
  >[];

  const totals = new Map<string, { debits: number; credits: number }>();
  for (const line of lines) {
    const t = totals.get(line.account_id) ?? { debits: 0, credits: 0 };
    t.debits += line.debit_cents;
    t.credits += line.credit_cents;
    totals.set(line.account_id, t);
  }

  return (
    <div className="space-y-6">
      {ACCOUNT_TYPE_ORDER.map((type) => {
        const group = accounts.filter((a) => a.type === type);
        if (group.length === 0) return null;
        return (
          <section
            key={type}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <h2 className="border-b border-slate-100 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-600">
              {ACCOUNT_TYPE_LABELS[type]}
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="sr-only">
                <tr>
                  <th>Code</th>
                  <th>Account</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {group.map((account) => {
                  const t = totals.get(account.id) ?? {
                    debits: 0,
                    credits: 0,
                  };
                  const balance = accountBalance(
                    account.type,
                    t.debits,
                    t.credits,
                  );
                  return (
                    <tr
                      key={account.id}
                      className="border-b border-slate-50 transition last:border-0 hover:bg-surface"
                    >
                      <td className="w-20 px-5 py-3 font-mono text-xs text-slate-500">
                        {account.code}
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-medium text-slate-900">
                          {account.name}
                        </span>
                        {account.subtype ? (
                          <span className="ml-2 hidden rounded-full bg-surface px-2 py-0.5 text-xs capitalize text-slate-500 sm:inline">
                            {account.subtype.replace(/_/g, " ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatMoney(balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
