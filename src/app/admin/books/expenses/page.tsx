import Link from "next/link";
import { Plus, Receipt, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/books/ledger";
import type { Expense, LedgerAccount, Vendor } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const supabase = await createClient();

  let expensesQuery = supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (query) {
    expensesQuery = expensesQuery.ilike("description", `%${query}%`);
  }

  const [expensesRes, vendorsRes, accountsRes] = await Promise.all([
    expensesQuery,
    supabase.from("vendors").select("id, name"),
    supabase.from("ledger_accounts").select("id, code, name"),
  ]);

  const expenses = (expensesRes.data ?? []) as Expense[];
  const vendorName = new Map(
    ((vendorsRes.data ?? []) as Pick<Vendor, "id" | "name">[]).map((v) => [
      v.id,
      v.name,
    ]),
  );
  const accountName = new Map(
    ((accountsRes.data ?? []) as Pick<LedgerAccount, "id" | "code" | "name">[]).map(
      (a) => [a.id, a.name],
    ),
  );

  // Short-lived signed URLs for the private receipts bucket.
  const receiptUrls = new Map<string, string>();
  const withReceipts = expenses.filter((e) => e.receipt_url);
  if (withReceipts.length > 0) {
    const { data: signed } = await supabase.storage
      .from("receipts")
      .createSignedUrls(
        withReceipts.map((e) => e.receipt_url as string),
        3600,
      );
    signed?.forEach((s, i) => {
      if (s.signedUrl) {
        receiptUrls.set(withReceipts[i].id, s.signedUrl);
      }
    });
  }

  const total = expenses.reduce((s, e) => s + e.amount_cents, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form action="/admin/books/expenses" className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <label htmlFor="expense-search" className="sr-only">
            Search expenses
          </label>
          <input
            id="expense-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search expenses…"
            className="w-64 rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </form>
        <Link
          href="/admin/books/expenses/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden /> New expense
        </Link>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
          <p className="font-medium text-slate-700">
            {query ? `No expenses match “${query}”.` : "No expenses recorded yet"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
            Record fuel, tolls, maintenance, and other business costs. Each
            expense posts a balanced journal entry automatically and can carry
            a receipt photo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3 text-center font-medium">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => {
                  const url = receiptUrls.get(expense.id);
                  return (
                    <tr
                      key={expense.id}
                      className="border-b border-slate-50 transition last:border-0 hover:bg-surface"
                    >
                      <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-5 py-3 text-slate-900">
                        {expense.description ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {expense.vendor_id
                          ? (vendorName.get(expense.vendor_id) ?? "—")
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {expense.category_account_id
                          ? (accountName.get(expense.category_account_id) ?? "—")
                          : "—"}
                      </td>
                      <td className="px-5 py-3 text-right font-medium tabular-nums text-slate-900">
                        {formatMoney(expense.amount_cents)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`View receipt for ${expense.description ?? "expense"}`}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary transition hover:bg-blue-50"
                          >
                            <Receipt className="h-4 w-4" aria-hidden />
                          </a>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-100 bg-surface/50">
                  <td colSpan={4} className="px-5 py-3 text-sm font-medium text-slate-600">
                    Total ({expenses.length})
                  </td>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                    {formatMoney(total)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
