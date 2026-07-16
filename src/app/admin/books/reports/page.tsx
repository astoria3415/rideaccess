import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatMoney,
  trialBalance,
  type LedgerAccountRef,
} from "@/lib/books/ledger";
import {
  balanceSheetReport,
  cashFlowReport,
  profitAndLossReport,
  scheduleCReport,
  type DatedLine,
  type ReportAccount,
  type ReportRow,
} from "@/lib/books/reports";
import type {
  Expense,
  JournalEntry,
  JournalLine,
  LedgerAccount,
  Vendor,
} from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { ExportCsvButton } from "@/components/admin/books/ExportCsvButton";

export const dynamic = "force-dynamic";

const REPORTS = [
  { key: "pnl", label: "Profit & Loss" },
  { key: "balance", label: "Balance Sheet" },
  { key: "cashflow", label: "Cash Flow" },
  { key: "trial", label: "Trial Balance" },
  { key: "schedule-c", label: "Schedule C" },
  { key: "1099", label: "1099 Vendors" },
] as const;

type ReportKey = (typeof REPORTS)[number]["key"];

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function periodPresets(): { label: string; from: string; to: string }[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = iso(now);
  const q = Math.floor(m / 3);
  return [
    { label: "This month", from: iso(new Date(Date.UTC(y, m, 1))), to: today },
    {
      label: "Last month",
      from: iso(new Date(Date.UTC(y, m - 1, 1))),
      to: iso(new Date(Date.UTC(y, m, 0))),
    },
    {
      label: "This quarter",
      from: iso(new Date(Date.UTC(y, q * 3, 1))),
      to: today,
    },
    { label: "Year to date", from: `${y}-01-01`, to: today },
    { label: "Last year", from: `${y - 1}-01-01`, to: `${y - 1}-12-31` },
  ];
}

function MoneyRow({
  label,
  amount,
  strong,
  indent,
}: {
  label: string;
  amount: number;
  strong?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-5 py-2 text-sm",
        strong ? "font-semibold text-slate-900" : "text-slate-700",
        indent && "pl-9",
      )}
    >
      <span>{label}</span>
      <span className="tabular-nums">{formatMoney(amount)}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="border-b border-slate-100 bg-surface/50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ report?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const presets = periodPresets();
  const ytd = presets[3];
  const report = (REPORTS.some((r) => r.key === params.report)
    ? params.report
    : "pnl") as ReportKey;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const from = DATE_RE.test(params.from ?? "") ? params.from! : ytd.from;
  const to = DATE_RE.test(params.to ?? "") ? params.to! : ytd.to;

  const supabase = await createClient();
  const [accountsRes, entriesRes, linesRes] = await Promise.all([
    supabase.from("ledger_accounts").select("*").order("code"),
    supabase.from("journal_entries").select("id, entry_date"),
    supabase.from("journal_lines").select("*"),
  ]);

  const accounts = (accountsRes.data ?? []) as LedgerAccount[];
  const entryDate = new Map(
    ((entriesRes.data ?? []) as Pick<JournalEntry, "id" | "entry_date">[]).map(
      (e) => [e.id, e.entry_date],
    ),
  );
  const lines: DatedLine[] = ((linesRes.data ?? []) as JournalLine[]).map(
    (l) => ({
      entry_id: l.entry_id,
      account_id: l.account_id,
      debit_cents: l.debit_cents,
      credit_cents: l.credit_cents,
      entry_date: entryDate.get(l.entry_id) ?? "1970-01-01",
    }),
  );
  const reportAccounts: ReportAccount[] = accounts.map((a) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    type: a.type,
    subtype: a.subtype,
    tax_line: a.tax_line,
  }));

  const year = Number(to.slice(0, 4));

  // ------------------------------------------------------------------
  // Render the selected report
  // ------------------------------------------------------------------
  let title = "";
  let subtitle = `${from} → ${to}`;
  let body: React.ReactNode = null;
  let csvRows: (string | number)[][] = [];

  const money = (c: number) => (c / 100).toFixed(2);
  const rowsToCsv = (rows: ReportRow[]) =>
    rows.map((r) => [r.account.code, r.account.name, money(r.amount_cents)]);

  if (report === "pnl") {
    const r = profitAndLossReport(reportAccounts, lines, { from, to });
    title = "Profit & Loss";
    csvRows = [
      ["Section", "Account", "Amount"],
      ...r.income.map((x) => ["Income", x.account.name, money(x.amount_cents)]),
      ...r.expenses.map((x) => ["Expenses", x.account.name, money(x.amount_cents)]),
      ["", "Net income", money(r.net_income_cents)],
    ];
    body = (
      <>
        <Section title="Income">
          {r.income.map((x) => (
            <MoneyRow key={x.account.id} label={`${x.account.code} · ${x.account.name}`} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Total income" amount={r.total_income_cents} strong />
        </Section>
        <Section title="Expenses">
          {r.expenses.map((x) => (
            <MoneyRow key={x.account.id} label={`${x.account.code} · ${x.account.name}`} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Total expenses" amount={r.total_expenses_cents} strong />
        </Section>
        <div className="border-t-2 border-slate-200">
          <MoneyRow label="Net income" amount={r.net_income_cents} strong />
        </div>
      </>
    );
  } else if (report === "balance") {
    const r = balanceSheetReport(reportAccounts, lines, to);
    title = "Balance Sheet";
    subtitle = `As of ${to}`;
    csvRows = [
      ["Section", "Account", "Amount"],
      ...r.assets.map((x) => ["Assets", x.account.name, money(x.amount_cents)]),
      ...r.liabilities.map((x) => ["Liabilities", x.account.name, money(x.amount_cents)]),
      ...r.equity.map((x) => ["Equity", x.account.name, money(x.amount_cents)]),
      ["Equity", "Retained earnings", money(r.retained_earnings_cents)],
    ];
    body = (
      <>
        <Section title="Assets">
          {r.assets.map((x) => (
            <MoneyRow key={x.account.id} label={`${x.account.code} · ${x.account.name}`} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Total assets" amount={r.total_assets_cents} strong />
        </Section>
        <Section title="Liabilities">
          {r.liabilities.map((x) => (
            <MoneyRow key={x.account.id} label={`${x.account.code} · ${x.account.name}`} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Total liabilities" amount={r.total_liabilities_cents} strong />
        </Section>
        <Section title="Equity">
          {r.equity.map((x) => (
            <MoneyRow key={x.account.id} label={`${x.account.code} · ${x.account.name}`} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Retained earnings (net income to date)" amount={r.retained_earnings_cents} indent />
          <MoneyRow label="Total equity" amount={r.total_equity_cents} strong />
        </Section>
        <div
          className={cn(
            "border-t-2 border-slate-200 px-5 py-2 text-sm font-medium",
            r.balanced ? "text-emerald-700" : "text-rose-700",
          )}
        >
          {r.balanced
            ? "✓ Assets equal liabilities plus equity."
            : "⚠ Out of balance — check for one-sided history before the ledger was adopted."}
        </div>
      </>
    );
  } else if (report === "cashflow") {
    const r = cashFlowReport(reportAccounts, lines, { from, to });
    title = "Cash Flow";
    csvRows = [
      ["Line", "Amount"],
      ["Opening cash", money(r.opening_cash_cents)],
      ["Operating activities", money(r.operating_cents)],
      ["Investing activities", money(r.investing_cents)],
      ["Financing activities", money(r.financing_cents)],
      ["Net change in cash", money(r.net_change_cents)],
      ["Closing cash", money(r.closing_cash_cents)],
    ];
    body = (
      <div className="divide-y divide-slate-50">
        <MoneyRow label="Opening cash" amount={r.opening_cash_cents} />
        <MoneyRow label="Cash from operating activities" amount={r.operating_cents} indent />
        <MoneyRow label="Cash from investing activities" amount={r.investing_cents} indent />
        <MoneyRow label="Cash from financing activities" amount={r.financing_cents} indent />
        <MoneyRow label="Net change in cash" amount={r.net_change_cents} strong />
        <MoneyRow label="Closing cash" amount={r.closing_cash_cents} strong />
      </div>
    );
  } else if (report === "trial") {
    const refs: LedgerAccountRef[] = reportAccounts.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
    }));
    const tb = trialBalance(
      refs,
      lines.filter((l) => l.entry_date <= to),
    );
    const active = tb.rows.filter((r) => r.debit_cents !== 0 || r.credit_cents !== 0);
    title = "Trial Balance";
    subtitle = `As of ${to}`;
    csvRows = [
      ["Code", "Account", "Debits", "Credits"],
      ...active.map((r) => [r.account.code, r.account.name, money(r.debit_cents), money(r.credit_cents)]),
      ["", "Totals", money(tb.total_debits), money(tb.total_credits)],
    ];
    body = (
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-2 font-medium">Account</th>
            <th className="px-5 py-2 text-right font-medium">Debits</th>
            <th className="px-5 py-2 text-right font-medium">Credits</th>
          </tr>
        </thead>
        <tbody>
          {active.map((r) => (
            <tr key={r.account.id} className="border-b border-slate-50">
              <td className="px-5 py-2 text-slate-700">
                {r.account.code} · {r.account.name}
              </td>
              <td className="px-5 py-2 text-right tabular-nums">{formatMoney(r.debit_cents)}</td>
              <td className="px-5 py-2 text-right tabular-nums">{formatMoney(r.credit_cents)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={cn("border-t-2 border-slate-200 font-semibold", tb.balanced ? "text-slate-900" : "text-rose-700")}>
            <td className="px-5 py-2">Totals {tb.balanced ? "✓" : "⚠ unbalanced"}</td>
            <td className="px-5 py-2 text-right tabular-nums">{formatMoney(tb.total_debits)}</td>
            <td className="px-5 py-2 text-right tabular-nums">{formatMoney(tb.total_credits)}</td>
          </tr>
        </tfoot>
      </table>
    );
  } else if (report === "schedule-c") {
    const r = scheduleCReport(reportAccounts, lines, year);
    title = `Schedule C — ${year}`;
    subtitle = `Tax year ${year} (from the “to” date)`;
    csvRows = [
      ["Schedule C line", "Amount", "Source accounts"],
      ...r.income.map((x) => [x.label, money(x.amount_cents), x.accounts.join("; ")]),
      ...r.expenses.map((x) => [x.label, money(x.amount_cents), x.accounts.join("; ")]),
      ["Net profit", money(r.net_profit_cents), ""],
    ];
    body = (
      <>
        <Section title="Income">
          {r.income.map((x) => (
            <MoneyRow key={x.tax_line} label={x.label} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Gross income" amount={r.gross_income_cents} strong />
        </Section>
        <Section title="Expenses">
          {r.expenses.map((x) => (
            <MoneyRow key={x.tax_line} label={x.label} amount={x.amount_cents} indent />
          ))}
          <MoneyRow label="Total expenses" amount={r.total_expenses_cents} strong />
        </Section>
        <div className="border-t-2 border-slate-200">
          <MoneyRow label="Tentative net profit (Line 31 basis)" amount={r.net_profit_cents} strong />
        </div>
        {r.unmapped.length > 0 ? (
          <div className="mx-5 my-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">
              {r.unmapped.length} account{r.unmapped.length === 1 ? "" : "s"} with activity but no tax line (included in totals above):
            </p>
            <ul className="mt-1 list-inside list-disc">
              {r.unmapped.map((x) => (
                <li key={x.account.id}>
                  {x.account.name} — {formatMoney(x.amount_cents)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="px-5 pb-4 pt-2 text-xs text-slate-400">
          Informational rollup for preparing IRS Schedule C — not tax advice.
          Review with your tax preparer.
        </p>
      </>
    );
  } else {
    // 1099 vendor payments for the year of the "to" date.
    const [expensesRes, vendorsRes] = await Promise.all([
      supabase
        .from("expenses")
        .select("vendor_id, amount_cents, expense_date")
        .gte("expense_date", `${year}-01-01`)
        .lte("expense_date", `${year}-12-31`),
      supabase.from("vendors").select("*").eq("is_1099", true),
    ]);
    const vendors = (vendorsRes.data ?? []) as Vendor[];
    const totals = new Map<string, number>();
    for (const e of (expensesRes.data ?? []) as Pick<
      Expense,
      "vendor_id" | "amount_cents" | "expense_date"
    >[]) {
      if (!e.vendor_id) continue;
      totals.set(e.vendor_id, (totals.get(e.vendor_id) ?? 0) + e.amount_cents);
    }
    const rows = vendors
      .map((v) => ({ vendor: v, total: totals.get(v.id) ?? 0 }))
      .sort((a, b) => b.total - a.total);
    title = `1099 Vendors — ${year}`;
    subtitle = `Payments to 1099-flagged vendors in ${year}; $600+ requires a 1099-NEC`;
    csvRows = [
      ["Vendor", "Email", "Total paid", "1099 required"],
      ...rows.map((r) => [
        r.vendor.name,
        r.vendor.email ?? "",
        money(r.total),
        r.total >= 60000 ? "YES" : "no",
      ]),
    ];
    body =
      rows.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          No vendors are flagged as 1099 contractors yet. Flag them on the
          Vendors tab and their yearly totals will appear here.
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <th className="px-5 py-2 font-medium">Vendor</th>
              <th className="px-5 py-2 text-right font-medium">Paid in {year}</th>
              <th className="px-5 py-2 text-center font-medium">1099-NEC</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.vendor.id} className="border-b border-slate-50">
                <td className="px-5 py-2 text-slate-700">{r.vendor.name}</td>
                <td className="px-5 py-2 text-right tabular-nums">{formatMoney(r.total)}</td>
                <td className="px-5 py-2 text-center">
                  {r.total >= 60000 ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Required
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
  }

  const query = (overrides: Record<string, string>) => {
    const p = new URLSearchParams({ report, from, to, ...overrides });
    return `/admin/books/reports?${p.toString()}`;
  };

  return (
    <div className="space-y-4">
      <nav aria-label="Report type" className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1">
        {REPORTS.map((r) => (
          <Link
            key={r.key}
            href={query({ report: r.key })}
            aria-current={report === r.key ? "page" : undefined}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              report === r.key ? "bg-primary text-white" : "text-slate-600 hover:bg-surface",
            )}
          >
            {r.label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500">Period:</span>
        {presets.map((p) => (
          <Link
            key={p.label}
            href={query({ from: p.from, to: p.to })}
            className={cn(
              "rounded-full border px-3 py-1 font-medium transition",
              from === p.from && to === p.to
                ? "border-primary bg-blue-50 text-primary"
                : "border-slate-200 text-slate-600 hover:bg-surface",
            )}
          >
            {p.label}
          </Link>
        ))}
        <form action="/admin/books/reports" className="flex items-center gap-1.5">
          <input type="hidden" name="report" value={report} />
          <label htmlFor="report-from" className="sr-only">From date</label>
          <input id="report-from" type="date" name="from" defaultValue={from} className="rounded-lg border border-slate-300 px-2 py-1 text-xs" />
          <span aria-hidden className="text-slate-400">→</span>
          <label htmlFor="report-to" className="sr-only">To date</label>
          <input id="report-to" type="date" name="to" defaultValue={to} className="rounded-lg border border-slate-300 px-2 py-1 text-xs" />
          <button type="submit" className="rounded-lg border border-slate-300 px-2.5 py-1 font-medium text-slate-700 transition hover:bg-surface">
            Apply
          </button>
        </form>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">{title}</h2>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
          <ExportCsvButton
            rows={csvRows}
            filename={`${report}-${from}-to-${to}.csv`}
          />
        </header>
        <div className="overflow-x-auto pb-2">{body}</div>
      </section>
    </div>
  );
}
