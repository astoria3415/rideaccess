import { describe, expect, it } from "vitest";
import {
  balanceSheetReport,
  cashFlowReport,
  profitAndLossReport,
  scheduleCReport,
  type DatedLine,
  type ReportAccount,
} from "./reports";

const accounts: ReportAccount[] = [
  { id: "checking", code: "1010", name: "Business Checking", type: "asset", subtype: "bank", tax_line: null },
  { id: "ar", code: "1200", name: "Accounts Receivable", type: "asset", subtype: "receivable", tax_line: null },
  { id: "van", code: "1500", name: "Vehicles", type: "asset", subtype: "fixed_asset", tax_line: null },
  { id: "loan", code: "2300", name: "Vehicle Loans", type: "liability", subtype: "long_term", tax_line: null },
  { id: "equity", code: "3000", name: "Owner's Equity", type: "equity", subtype: "equity", tax_line: null },
  { id: "rides", code: "4000", name: "Ride Revenue", type: "income", subtype: "operating", tax_line: "gross_receipts" },
  { id: "fuel", code: "5000", name: "Fuel", type: "expense", subtype: "vehicle", tax_line: "car_and_truck" },
  { id: "tolls", code: "5300", name: "Tolls & Parking", type: "expense", subtype: "vehicle", tax_line: "car_and_truck" },
  { id: "misc", code: "6900", name: "Miscellaneous Expense", type: "expense", subtype: "other", tax_line: null },
];

let entrySeq = 0;
function entry(
  date: string,
  ...pairs: [string, number, number][]
): DatedLine[] {
  const id = `e${++entrySeq}`;
  return pairs.map(([account_id, debit, credit]) => ({
    entry_id: id,
    account_id,
    debit_cents: debit,
    credit_cents: credit,
    entry_date: date,
  }));
}

// A small but complete year of activity:
const lines: DatedLine[] = [
  // Jan 5: owner puts $10,000 into checking (financing).
  ...entry("2026-01-05", ["checking", 1000000, 0], ["equity", 0, 1000000]),
  // Feb 1: buy a van for $6,000 cash (investing).
  ...entry("2026-02-01", ["van", 600000, 0], ["checking", 0, 600000]),
  // Mar 3: $1,500 of rides paid into checking (operating).
  ...entry("2026-03-03", ["checking", 150000, 0], ["rides", 0, 150000]),
  // Mar 10: $450 fuel from checking (operating).
  ...entry("2026-03-10", ["fuel", 45000, 0], ["checking", 0, 45000]),
  // Mar 12: $80 tolls from checking (operating).
  ...entry("2026-03-12", ["tolls", 8000, 0], ["checking", 0, 8000]),
  // Apr 1: invoice a facility $2,000 (no cash movement).
  ...entry("2026-04-01", ["ar", 200000, 0], ["rides", 0, 200000]),
  // Apr 20: misc expense $25 from checking.
  ...entry("2026-04-20", ["misc", 2500, 0], ["checking", 0, 2500]),
  // May 1: borrow $3,000 (financing).
  ...entry("2026-05-01", ["checking", 300000, 0], ["loan", 0, 300000]),
];

describe("profitAndLossReport", () => {
  it("computes income, expenses, and net for the period", () => {
    const report = profitAndLossReport(accounts, lines, {
      from: "2026-01-01",
      to: "2026-12-31",
    });
    expect(report.total_income_cents).toBe(350000);
    expect(report.total_expenses_cents).toBe(55500);
    expect(report.net_income_cents).toBe(294500);
    expect(report.income.map((r) => r.account.id)).toEqual(["rides"]);
    expect(report.expenses.map((r) => r.account.id)).toEqual([
      "fuel",
      "tolls",
      "misc",
    ]);
  });

  it("respects the period window", () => {
    const march = profitAndLossReport(accounts, lines, {
      from: "2026-03-01",
      to: "2026-03-31",
    });
    expect(march.total_income_cents).toBe(150000);
    expect(march.total_expenses_cents).toBe(53000);
  });
});

describe("balanceSheetReport", () => {
  it("balances via retained earnings", () => {
    const report = balanceSheetReport(accounts, lines, "2026-12-31");
    // Checking: 10000 - 6000 + 1500 - 450 - 80 - 25 + 3000 = 7945
    expect(
      report.assets.find((r) => r.account.id === "checking")?.amount_cents,
    ).toBe(794500);
    expect(report.total_assets_cents).toBe(794500 + 200000 + 600000);
    expect(report.total_liabilities_cents).toBe(300000);
    expect(report.retained_earnings_cents).toBe(294500);
    expect(report.total_equity_cents).toBe(1000000 + 294500);
    expect(report.balanced).toBe(true);
  });

  it("reflects only activity up to the as-of date", () => {
    const early = balanceSheetReport(accounts, lines, "2026-01-31");
    expect(early.total_assets_cents).toBe(1000000);
    expect(early.retained_earnings_cents).toBe(0);
    expect(early.balanced).toBe(true);
  });
});

describe("cashFlowReport", () => {
  it("buckets operating, investing, and financing flows", () => {
    const report = cashFlowReport(accounts, lines, {
      from: "2026-01-01",
      to: "2026-12-31",
    });
    // Operating: +1500 - 450 - 80 - 25 = 945
    expect(report.operating_cents).toBe(94500);
    expect(report.investing_cents).toBe(-600000);
    // Financing: +10000 owner + 3000 loan
    expect(report.financing_cents).toBe(1300000);
    expect(report.net_change_cents).toBe(794500);
    expect(report.opening_cash_cents).toBe(0);
    expect(report.closing_cash_cents).toBe(794500);
  });

  it("carries the opening balance from before the period", () => {
    const q2 = cashFlowReport(accounts, lines, {
      from: "2026-04-01",
      to: "2026-06-30",
    });
    // Before Apr 1: 10000 - 6000 + 1500 - 450 - 80 = 4970
    expect(q2.opening_cash_cents).toBe(497000);
    expect(q2.net_change_cents).toBe(-2500 + 300000);
    expect(q2.closing_cash_cents).toBe(497000 - 2500 + 300000);
  });

  it("ignores entries that do not touch cash", () => {
    const april = cashFlowReport(accounts, lines, {
      from: "2026-04-01",
      to: "2026-04-15",
    });
    expect(april.net_change_cents).toBe(0);
  });
});

describe("scheduleCReport", () => {
  it("rolls accounts up into Schedule C lines", () => {
    const report = scheduleCReport(accounts, lines, 2026);
    expect(report.gross_income_cents).toBe(350000);

    const carTruck = report.expenses.find(
      (r) => r.tax_line === "car_and_truck",
    );
    expect(carTruck?.amount_cents).toBe(53000);
    expect(carTruck?.accounts.sort()).toEqual(["Fuel", "Tolls & Parking"]);
    expect(report.net_profit_cents).toBe(294500);
  });

  it("flags active accounts without a tax mapping", () => {
    const report = scheduleCReport(accounts, lines, 2026);
    expect(report.unmapped.map((r) => r.account.id)).toEqual(["misc"]);
    expect(report.unmapped[0].amount_cents).toBe(2500);
  });

  it("returns empty rows for a year with no activity", () => {
    const report = scheduleCReport(accounts, lines, 2024);
    expect(report.income).toEqual([]);
    expect(report.expenses).toEqual([]);
    expect(report.net_profit_cents).toBe(0);
  });
});
