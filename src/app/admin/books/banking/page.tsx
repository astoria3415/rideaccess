import { createClient } from "@/lib/supabase/server";
import type {
  BankTransaction,
  JournalEntry,
  JournalLine,
  LedgerAccount,
} from "@/lib/supabase/types";
import {
  findMatches,
  type MatchCandidate,
} from "@/lib/books/bank-import";
import { BankImport } from "@/components/admin/books/BankImport";
import { BankTxnRow } from "@/components/admin/books/BankTxnRow";

export const dynamic = "force-dynamic";

export default async function BankingPage() {
  const supabase = await createClient();

  const [accountsRes, txnsRes] = await Promise.all([
    supabase
      .from("ledger_accounts")
      .select("id, code, name, type, subtype")
      .eq("is_archived", false)
      .order("code"),
    supabase
      .from("bank_transactions")
      .select("*")
      .order("txn_date", { ascending: false })
      .limit(500),
  ]);

  const accounts = (accountsRes.data ?? []) as Pick<
    LedgerAccount,
    "id" | "code" | "name" | "type" | "subtype"
  >[];
  const txns = (txnsRes.data ?? []) as BankTransaction[];

  const bankAccounts = accounts.filter(
    (a) =>
      (a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? "")) ||
      (a.type === "liability" && a.subtype === "credit_card"),
  );
  const categoryAccounts = accounts.filter(
    (a) => a.type === "expense" || a.type === "income",
  );
  const accountLabel = new Map(
    accounts.map((a) => [a.id, `${a.code} · ${a.name}`]),
  );

  const unmatched = txns.filter((t) => t.status === "unmatched");
  const handled = txns.filter((t) => t.status !== "unmatched").slice(0, 20);

  // Build match candidates per bank account: each journal entry's net
  // effect (debit - credit) on that account.
  const candidatesByAccount = new Map<string, MatchCandidate[]>();
  const usedEntryIds = new Set(
    txns
      .filter((t) => t.journal_entry_id)
      .map((t) => t.journal_entry_id as string),
  );
  if (unmatched.length > 0) {
    const bankIds = [...new Set(unmatched.map((t) => t.account_id))];
    const [linesRes, entriesRes] = await Promise.all([
      supabase
        .from("journal_lines")
        .select("entry_id, account_id, debit_cents, credit_cents")
        .in("account_id", bankIds),
      supabase
        .from("journal_entries")
        .select("id, entry_number, entry_date, memo"),
    ]);
    const entryMeta = new Map(
      ((entriesRes.data ?? []) as Pick<
        JournalEntry,
        "id" | "entry_number" | "entry_date" | "memo"
      >[]).map((e) => [e.id, e]),
    );

    const deltas = new Map<string, Map<string, number>>(); // account -> entry -> delta
    for (const line of (linesRes.data ?? []) as Pick<
      JournalLine,
      "entry_id" | "account_id" | "debit_cents" | "credit_cents"
    >[]) {
      const perEntry = deltas.get(line.account_id) ?? new Map<string, number>();
      perEntry.set(
        line.entry_id,
        (perEntry.get(line.entry_id) ?? 0) + line.debit_cents - line.credit_cents,
      );
      deltas.set(line.account_id, perEntry);
    }

    for (const [accountId, perEntry] of deltas) {
      const list: MatchCandidate[] = [];
      for (const [entryId, delta] of perEntry) {
        if (usedEntryIds.has(entryId)) continue;
        const meta = entryMeta.get(entryId);
        if (!meta || delta === 0) continue;
        list.push({
          entry_id: entryId,
          entry_number: meta.entry_number,
          entry_date: meta.entry_date,
          memo: meta.memo,
          bank_delta_cents: delta,
        });
      }
      candidatesByAccount.set(accountId, list);
    }
  }

  return (
    <div className="space-y-6">
      <BankImport bankAccounts={bankAccounts} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-600">
          To review ({unmatched.length})
        </h2>
        {unmatched.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-slate-700">All caught up</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Import a CSV statement above. Rows that match existing ledger
              entries can be reconciled with one click; the rest can be
              categorized straight into the books.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {unmatched.map((txn) => (
              <BankTxnRow
                key={txn.id}
                txn={txn}
                accountLabel={accountLabel.get(txn.account_id) ?? "Account"}
                matches={findMatches(
                  txn,
                  candidatesByAccount.get(txn.account_id) ?? [],
                ).slice(0, 3)}
                categoryAccounts={categoryAccounts}
              />
            ))}
          </ul>
        )}
      </section>

      {handled.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <h2 className="border-b border-slate-100 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-600">
            Recently handled
          </h2>
          <ul className="divide-y divide-slate-50 text-sm">
            {handled.map((txn) => (
              <li
                key={txn.id}
                className="flex items-center justify-between gap-3 px-5 py-2.5"
              >
                <span className="truncate text-slate-600">
                  {txn.txn_date} — {txn.description}
                </span>
                <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs capitalize text-slate-500">
                  {txn.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
