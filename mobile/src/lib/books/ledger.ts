/**
 * Pure double-entry ledger engine for AccessRide Books.
 *
 * All amounts are integer cents. Debits and credits are kept as separate
 * non-negative columns (mirroring the journal_lines table) and every
 * function here is side-effect free so it can be unit tested and shared
 * with the mobile apps later.
 */

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "income"
  | "expense";

export type NormalBalance = "debit" | "credit";

export type LedgerLine = {
  account_id: string;
  debit_cents: number;
  credit_cents: number;
  description?: string | null;
};

export type LedgerAccountRef = {
  id: string;
  code: string;
  name: string;
  type: AccountType;
};

/** Which side increases an account of the given type. */
export function normalBalance(type: AccountType): NormalBalance {
  switch (type) {
    case "asset":
    case "expense":
      return "debit";
    case "liability":
    case "equity":
    case "income":
      return "credit";
  }
}

export type EntryValidationError =
  | { code: "too_few_lines"; message: string }
  | { code: "negative_amount"; message: string; index: number }
  | { code: "two_sided_line"; message: string; index: number }
  | { code: "empty_line"; message: string; index: number }
  | { code: "missing_account"; message: string; index: number }
  | { code: "unbalanced"; message: string; imbalance_cents: number };

/**
 * Validates a candidate journal entry. Returns [] when the entry is
 * postable: at least two lines, every line single-sided with a positive
 * integer amount and an account, and total debits equal total credits.
 */
export function validateEntry(lines: LedgerLine[]): EntryValidationError[] {
  const errors: EntryValidationError[] = [];

  if (lines.length < 2) {
    errors.push({
      code: "too_few_lines",
      message: "A journal entry needs at least two lines.",
    });
  }

  lines.forEach((line, index) => {
    const debit = line.debit_cents;
    const credit = line.credit_cents;
    if (!line.account_id) {
      errors.push({
        code: "missing_account",
        message: `Line ${index + 1} has no account selected.`,
        index,
      });
    }
    if (
      debit < 0 ||
      credit < 0 ||
      !Number.isInteger(debit) ||
      !Number.isInteger(credit)
    ) {
      errors.push({
        code: "negative_amount",
        message: `Line ${index + 1} must use non-negative whole cents.`,
        index,
      });
      return;
    }
    if (debit > 0 && credit > 0) {
      errors.push({
        code: "two_sided_line",
        message: `Line ${index + 1} cannot have both a debit and a credit.`,
        index,
      });
    }
    if (debit === 0 && credit === 0) {
      errors.push({
        code: "empty_line",
        message: `Line ${index + 1} has no amount.`,
        index,
      });
    }
  });

  const imbalance = lines.reduce(
    (sum, l) => sum + (l.debit_cents - l.credit_cents),
    0,
  );
  if (imbalance !== 0) {
    errors.push({
      code: "unbalanced",
      message: `Debits and credits differ by ${formatMoney(Math.abs(imbalance))}.`,
      imbalance_cents: imbalance,
    });
  }

  return errors;
}

/**
 * Signed balance of an account in its natural direction: a checking
 * account with more debits than credits is positive, and so is a revenue
 * account with more credits than debits.
 */
export function accountBalance(
  type: AccountType,
  totalDebits: number,
  totalCredits: number,
): number {
  return normalBalance(type) === "debit"
    ? totalDebits - totalCredits
    : totalCredits - totalDebits;
}

export type TrialBalanceRow = {
  account: LedgerAccountRef;
  debit_cents: number;
  credit_cents: number;
  balance_cents: number;
};

export type TrialBalance = {
  rows: TrialBalanceRow[];
  total_debits: number;
  total_credits: number;
  balanced: boolean;
};

/** Aggregates raw journal lines into per-account totals. */
export function trialBalance(
  accounts: LedgerAccountRef[],
  lines: LedgerLine[],
): TrialBalance {
  const byAccount = new Map<string, { debits: number; credits: number }>();
  for (const line of lines) {
    const bucket = byAccount.get(line.account_id) ?? { debits: 0, credits: 0 };
    bucket.debits += line.debit_cents;
    bucket.credits += line.credit_cents;
    byAccount.set(line.account_id, bucket);
  }

  const rows: TrialBalanceRow[] = accounts
    .map((account) => {
      const totals = byAccount.get(account.id) ?? { debits: 0, credits: 0 };
      return {
        account,
        debit_cents: totals.debits,
        credit_cents: totals.credits,
        balance_cents: accountBalance(
          account.type,
          totals.debits,
          totals.credits,
        ),
      };
    })
    .sort((a, b) => a.account.code.localeCompare(b.account.code));

  const total_debits = rows.reduce((s, r) => s + r.debit_cents, 0);
  const total_credits = rows.reduce((s, r) => s + r.credit_cents, 0);

  return {
    rows,
    total_debits,
    total_credits,
    balanced: total_debits === total_credits,
  };
}

export type ProfitAndLoss = {
  income_cents: number;
  expense_cents: number;
  net_cents: number;
};

/** Income and expense totals from a trial balance (or any row subset). */
export function profitAndLoss(rows: TrialBalanceRow[]): ProfitAndLoss {
  let income = 0;
  let expense = 0;
  for (const row of rows) {
    if (row.account.type === "income") income += row.balance_cents;
    if (row.account.type === "expense") expense += row.balance_cents;
  }
  return {
    income_cents: income,
    expense_cents: expense,
    net_cents: income - expense,
  };
}

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Formats integer cents as USD, e.g. 123456 -> "$1,234.56". */
export function formatMoney(cents: number): string {
  return usd.format(cents / 100);
}

/** Parses a user-typed dollar amount ("1,234.56") into cents, or null. */
export function parseMoney(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(parseFloat(cleaned) * 100);
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  asset: "Assets",
  liability: "Liabilities",
  equity: "Equity",
  income: "Income",
  expense: "Expenses",
};

export const ACCOUNT_TYPE_ORDER: AccountType[] = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
];
