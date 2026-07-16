import { describe, expect, it } from "vitest";
import {
  accountBalance,
  formatMoney,
  normalBalance,
  parseMoney,
  profitAndLoss,
  trialBalance,
  validateEntry,
  type LedgerAccountRef,
} from "./ledger";

const accounts: LedgerAccountRef[] = [
  { id: "checking", code: "1010", name: "Business Checking", type: "asset" },
  { id: "ar", code: "1200", name: "Accounts Receivable", type: "asset" },
  { id: "card", code: "2100", name: "Business Credit Card", type: "liability" },
  { id: "equity", code: "3000", name: "Owner's Equity", type: "equity" },
  { id: "rides", code: "4000", name: "Ride Revenue", type: "income" },
  { id: "fuel", code: "5000", name: "Fuel", type: "expense" },
];

function line(account_id: string, debit: number, credit: number) {
  return { account_id, debit_cents: debit, credit_cents: credit };
}

describe("normalBalance", () => {
  it("debits increase assets and expenses", () => {
    expect(normalBalance("asset")).toBe("debit");
    expect(normalBalance("expense")).toBe("debit");
  });

  it("credits increase liabilities, equity, and income", () => {
    expect(normalBalance("liability")).toBe("credit");
    expect(normalBalance("equity")).toBe("credit");
    expect(normalBalance("income")).toBe("credit");
  });
});

describe("validateEntry", () => {
  it("accepts a balanced two-line entry", () => {
    const errors = validateEntry([
      line("checking", 15000, 0),
      line("rides", 0, 15000),
    ]);
    expect(errors).toEqual([]);
  });

  it("accepts a balanced split entry", () => {
    const errors = validateEntry([
      line("fuel", 4000, 0),
      line("card", 0, 3000),
      line("checking", 0, 1000),
    ]);
    expect(errors).toEqual([]);
  });

  it("rejects entries with fewer than two lines", () => {
    const errors = validateEntry([line("checking", 100, 0)]);
    expect(errors.map((e) => e.code)).toContain("too_few_lines");
  });

  it("rejects unbalanced entries and reports the imbalance", () => {
    const errors = validateEntry([
      line("checking", 10000, 0),
      line("rides", 0, 9000),
    ]);
    const unbalanced = errors.find((e) => e.code === "unbalanced");
    expect(unbalanced).toBeDefined();
    expect(
      unbalanced && "imbalance_cents" in unbalanced
        ? unbalanced.imbalance_cents
        : 0,
    ).toBe(1000);
  });

  it("rejects a line with both a debit and a credit", () => {
    const errors = validateEntry([
      line("checking", 500, 500),
      line("rides", 0, 0),
    ]);
    const codes = errors.map((e) => e.code);
    expect(codes).toContain("two_sided_line");
    expect(codes).toContain("empty_line");
  });

  it("rejects negative and fractional amounts", () => {
    expect(
      validateEntry([line("checking", -100, 0), line("rides", 0, -100)]).map(
        (e) => e.code,
      ),
    ).toContain("negative_amount");
    expect(
      validateEntry([line("checking", 100.5, 0), line("rides", 0, 100.5)]).map(
        (e) => e.code,
      ),
    ).toContain("negative_amount");
  });

  it("rejects lines without an account", () => {
    const errors = validateEntry([line("", 100, 0), line("rides", 0, 100)]);
    expect(errors.map((e) => e.code)).toContain("missing_account");
  });
});

describe("accountBalance", () => {
  it("computes natural-direction balances", () => {
    expect(accountBalance("asset", 5000, 2000)).toBe(3000);
    expect(accountBalance("income", 0, 7000)).toBe(7000);
    expect(accountBalance("liability", 1000, 4000)).toBe(3000);
    expect(accountBalance("expense", 2500, 0)).toBe(2500);
  });

  it("goes negative when the account is overdrawn", () => {
    expect(accountBalance("asset", 1000, 3000)).toBe(-2000);
  });
});

describe("trialBalance", () => {
  it("aggregates lines per account and always balances", () => {
    // $150 ride paid to checking; $40 fuel on the credit card.
    const tb = trialBalance(accounts, [
      line("checking", 15000, 0),
      line("rides", 0, 15000),
      line("fuel", 4000, 0),
      line("card", 0, 4000),
    ]);

    expect(tb.balanced).toBe(true);
    expect(tb.total_debits).toBe(19000);
    expect(tb.total_credits).toBe(19000);

    const byId = new Map(tb.rows.map((r) => [r.account.id, r]));
    expect(byId.get("checking")?.balance_cents).toBe(15000);
    expect(byId.get("rides")?.balance_cents).toBe(15000);
    expect(byId.get("fuel")?.balance_cents).toBe(4000);
    expect(byId.get("card")?.balance_cents).toBe(4000);
    expect(byId.get("equity")?.balance_cents).toBe(0);
  });

  it("sorts rows by account code", () => {
    const tb = trialBalance(accounts, []);
    expect(tb.rows.map((r) => r.account.code)).toEqual([
      "1010",
      "1200",
      "2100",
      "3000",
      "4000",
      "5000",
    ]);
  });
});

describe("profitAndLoss", () => {
  it("nets income against expenses", () => {
    const tb = trialBalance(accounts, [
      line("checking", 15000, 0),
      line("rides", 0, 15000),
      line("fuel", 4000, 0),
      line("card", 0, 4000),
    ]);
    const pl = profitAndLoss(tb.rows);
    expect(pl.income_cents).toBe(15000);
    expect(pl.expense_cents).toBe(4000);
    expect(pl.net_cents).toBe(11000);
  });
});

describe("money helpers", () => {
  it("formats cents as USD", () => {
    expect(formatMoney(123456)).toBe("$1,234.56");
    expect(formatMoney(0)).toBe("$0.00");
  });

  it("parses dollar strings into cents", () => {
    expect(parseMoney("1,234.56")).toBe(123456);
    expect(parseMoney("$99")).toBe(9900);
    expect(parseMoney("0.1")).toBe(10);
    expect(parseMoney("abc")).toBeNull();
    expect(parseMoney("1.234")).toBeNull();
  });
});
