/**
 * Financial reports for AccessRide Books.
 *
 * Every report is a pure function over the chart of accounts and dated
 * journal lines, so the exact same math can back the web UI, CSV
 * exports, and the mobile apps. Amounts are integer cents throughout.
 */

import { accountBalance, type AccountType } from "./ledger";

export type ReportAccount = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string | null;
  tax_line: string | null;
};

export type DatedLine = {
  entry_id: string;
  account_id: string;
  debit_cents: number;
  credit_cents: number;
  entry_date: string; // YYYY-MM-DD
};

export type ReportRow = {
  account: ReportAccount;
  amount_cents: number;
};

function inRange(date: string, from?: string, to?: string): boolean {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function balancesByAccount(
  accounts: ReportAccount[],
  lines: DatedLine[],
  from?: string,
  to?: string,
): Map<string, number> {
  const totals = new Map<string, { d: number; c: number }>();
  for (const line of lines) {
    if (!inRange(line.entry_date, from, to)) continue;
    const t = totals.get(line.account_id) ?? { d: 0, c: 0 };
    t.d += line.debit_cents;
    t.c += line.credit_cents;
    totals.set(line.account_id, t);
  }
  const result = new Map<string, number>();
  for (const account of accounts) {
    const t = totals.get(account.id) ?? { d: 0, c: 0 };
    result.set(account.id, accountBalance(account.type, t.d, t.c));
  }
  return result;
}

function rowsForType(
  accounts: ReportAccount[],
  balances: Map<string, number>,
  type: AccountType,
  includeZero = false,
): ReportRow[] {
  return accounts
    .filter((a) => a.type === type)
    .map((a) => ({ account: a, amount_cents: balances.get(a.id) ?? 0 }))
    .filter((r) => includeZero || r.amount_cents !== 0)
    .sort((a, b) => a.account.code.localeCompare(b.account.code));
}

const sum = (rows: ReportRow[]) => rows.reduce((s, r) => s + r.amount_cents, 0);

// ---------------------------------------------------------------------
// Profit & Loss
// ---------------------------------------------------------------------

export type ProfitAndLossReport = {
  income: ReportRow[];
  expenses: ReportRow[];
  total_income_cents: number;
  total_expenses_cents: number;
  net_income_cents: number;
};

export function profitAndLossReport(
  accounts: ReportAccount[],
  lines: DatedLine[],
  period: { from: string; to: string },
): ProfitAndLossReport {
  const balances = balancesByAccount(accounts, lines, period.from, period.to);
  const income = rowsForType(accounts, balances, "income");
  const expenses = rowsForType(accounts, balances, "expense");
  const total_income_cents = sum(income);
  const total_expenses_cents = sum(expenses);
  return {
    income,
    expenses,
    total_income_cents,
    total_expenses_cents,
    net_income_cents: total_income_cents - total_expenses_cents,
  };
}

// ---------------------------------------------------------------------
// Balance sheet
// ---------------------------------------------------------------------

export type BalanceSheetReport = {
  assets: ReportRow[];
  liabilities: ReportRow[];
  equity: ReportRow[];
  /** Lifetime net income through the as-of date, shown inside equity. */
  retained_earnings_cents: number;
  total_assets_cents: number;
  total_liabilities_cents: number;
  total_equity_cents: number;
  balanced: boolean;
};

export function balanceSheetReport(
  accounts: ReportAccount[],
  lines: DatedLine[],
  asOf: string,
): BalanceSheetReport {
  const balances = balancesByAccount(accounts, lines, undefined, asOf);
  const assets = rowsForType(accounts, balances, "asset");
  const liabilities = rowsForType(accounts, balances, "liability");
  const equity = rowsForType(accounts, balances, "equity");

  // The books are never "closed": income and expense balances roll into
  // equity here so the statement balances.
  const income = sum(rowsForType(accounts, balances, "income"));
  const expenses = sum(rowsForType(accounts, balances, "expense"));
  const retained_earnings_cents = income - expenses;

  const total_assets_cents = sum(assets);
  const total_liabilities_cents = sum(liabilities);
  const total_equity_cents = sum(equity) + retained_earnings_cents;

  return {
    assets,
    liabilities,
    equity,
    retained_earnings_cents,
    total_assets_cents,
    total_liabilities_cents,
    total_equity_cents,
    balanced:
      total_assets_cents === total_liabilities_cents + total_equity_cents,
  };
}

// ---------------------------------------------------------------------
// Cash flow (direct method, bucketed by counter-account)
// ---------------------------------------------------------------------

export type CashFlowReport = {
  operating_cents: number;
  investing_cents: number;
  financing_cents: number;
  net_change_cents: number;
  opening_cash_cents: number;
  closing_cash_cents: number;
};

const isCashAccount = (a: ReportAccount) =>
  a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? "");

/**
 * For every journal entry that moves cash, the cash delta is bucketed
 * by the entry's dominant counter-account: income/expense → operating,
 * other assets → investing, liabilities/equity → financing.
 */
export function cashFlowReport(
  accounts: ReportAccount[],
  lines: DatedLine[],
  period: { from: string; to: string },
): CashFlowReport {
  const byId = new Map(accounts.map((a) => [a.id, a]));
  const cashIds = new Set(accounts.filter(isCashAccount).map((a) => a.id));

  let opening = 0;
  for (const line of lines) {
    if (cashIds.has(line.account_id) && line.entry_date < period.from) {
      opening += line.debit_cents - line.credit_cents;
    }
  }

  // Group the period's lines by entry.
  const entries = new Map<string, DatedLine[]>();
  for (const line of lines) {
    if (!inRange(line.entry_date, period.from, period.to)) continue;
    const list = entries.get(line.entry_id) ?? [];
    list.push(line);
    entries.set(line.entry_id, list);
  }

  let operating = 0;
  let investing = 0;
  let financing = 0;

  for (const entryLines of entries.values()) {
    let cashDelta = 0;
    const counterWeight = { operating: 0, investing: 0, financing: 0 };

    for (const line of entryLines) {
      const magnitude = line.debit_cents + line.credit_cents;
      if (cashIds.has(line.account_id)) {
        cashDelta += line.debit_cents - line.credit_cents;
        continue;
      }
      const account = byId.get(line.account_id);
      if (!account) continue;
      if (account.type === "income" || account.type === "expense") {
        counterWeight.operating += magnitude;
      } else if (account.type === "asset") {
        counterWeight.investing += magnitude;
      } else {
        counterWeight.financing += magnitude;
      }
    }

    if (cashDelta === 0) continue;
    const dominant = (
      Object.entries(counterWeight) as [keyof typeof counterWeight, number][]
    ).sort((a, b) => b[1] - a[1])[0];
    // Cash-only entries (e.g. moving money between bank accounts) net to
    // zero overall; if a lone counter bucket never appeared, treat the
    // movement as operating.
    const bucket = dominant[1] > 0 ? dominant[0] : "operating";
    if (bucket === "operating") operating += cashDelta;
    else if (bucket === "investing") investing += cashDelta;
    else financing += cashDelta;
  }

  const net = operating + investing + financing;
  return {
    operating_cents: operating,
    investing_cents: investing,
    financing_cents: financing,
    net_change_cents: net,
    opening_cash_cents: opening,
    closing_cash_cents: opening + net,
  };
}

// ---------------------------------------------------------------------
// Schedule C (US sole proprietor / single-member LLC)
// ---------------------------------------------------------------------

export const SCHEDULE_C_LABELS: Record<string, string> = {
  gross_receipts: "Gross receipts or sales — Part I, Line 1",
  other_income: "Other income — Line 6",
  advertising: "Advertising — Line 8",
  car_and_truck: "Car and truck expenses — Line 9",
  depreciation: "Depreciation — Line 13",
  insurance: "Insurance (other than health) — Line 15",
  legal_professional: "Legal and professional services — Line 17",
  office_expense: "Office expense — Line 18",
  repairs_maintenance: "Repairs and maintenance — Line 21",
  supplies: "Supplies — Line 22",
  taxes_licenses: "Taxes and licenses — Line 23",
  wages: "Wages — Line 26",
  other_expenses: "Other expenses — Line 27a",
};

export type ScheduleCRow = {
  tax_line: string;
  label: string;
  amount_cents: number;
  accounts: string[]; // account names feeding the line
};

export type ScheduleCReport = {
  income: ScheduleCRow[];
  expenses: ScheduleCRow[];
  gross_income_cents: number;
  total_expenses_cents: number;
  net_profit_cents: number;
  /** Accounts with activity but no tax-line mapping — flagged, not lost. */
  unmapped: ReportRow[];
};

export function scheduleCReport(
  accounts: ReportAccount[],
  lines: DatedLine[],
  year: number,
): ScheduleCReport {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const balances = balancesByAccount(accounts, lines, from, to);

  const grouped = new Map<string, ScheduleCRow>();
  const unmapped: ReportRow[] = [];

  for (const account of accounts) {
    if (account.type !== "income" && account.type !== "expense") continue;
    const amount = balances.get(account.id) ?? 0;
    if (amount === 0) continue;
    if (!account.tax_line) {
      unmapped.push({ account, amount_cents: amount });
      continue;
    }
    const row = grouped.get(account.tax_line) ?? {
      tax_line: account.tax_line,
      label: SCHEDULE_C_LABELS[account.tax_line] ?? account.tax_line,
      amount_cents: 0,
      accounts: [],
    };
    row.amount_cents += amount;
    row.accounts.push(account.name);
    grouped.set(account.tax_line, row);
  }

  const incomeLines = new Set(["gross_receipts", "other_income"]);
  const rows = [...grouped.values()].sort((a, b) =>
    a.label.localeCompare(b.label),
  );
  const income = rows.filter((r) => incomeLines.has(r.tax_line));
  const expenses = rows.filter((r) => !incomeLines.has(r.tax_line));
  // Unmapped activity still counts toward the totals (so net profit
  // always agrees with the P&L); the rows are flagged for remapping.
  const unmappedIncome = unmapped
    .filter((r) => r.account.type === "income")
    .reduce((s, r) => s + r.amount_cents, 0);
  const unmappedExpenses = unmapped
    .filter((r) => r.account.type === "expense")
    .reduce((s, r) => s + r.amount_cents, 0);
  const gross_income_cents =
    income.reduce((s, r) => s + r.amount_cents, 0) + unmappedIncome;
  const total_expenses_cents =
    expenses.reduce((s, r) => s + r.amount_cents, 0) + unmappedExpenses;

  return {
    income,
    expenses,
    gross_income_cents,
    total_expenses_cents,
    net_profit_cents: gross_income_cents - total_expenses_cents,
    unmapped,
  };
}
