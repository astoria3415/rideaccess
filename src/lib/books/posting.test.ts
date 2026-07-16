import { describe, expect, it } from "vitest";
import {
  ACCOUNTS,
  buildDirectPaymentLines,
  buildInvoiceIssuedLines,
  buildInvoicePaidLines,
  type AccountIdsByCode,
} from "./posting";

const accounts: AccountIdsByCode = {
  [ACCOUNTS.CHECKING]: "id-checking",
  [ACCOUNTS.ACCOUNTS_RECEIVABLE]: "id-ar",
  [ACCOUNTS.SALES_TAX_PAYABLE]: "id-tax",
  [ACCOUNTS.RIDE_REVENUE]: "id-revenue",
};

function balanced(lines: { debit_cents: number; credit_cents: number }[]) {
  return (
    lines.reduce((s, l) => s + l.debit_cents - l.credit_cents, 0) === 0
  );
}

describe("buildInvoiceIssuedLines", () => {
  it("debits A/R and credits revenue for a tax-free invoice", () => {
    const lines = buildInvoiceIssuedLines(accounts, {
      invoice_number: "INV-1001",
      subtotal_cents: 15000,
      tax_cents: 0,
      total_cents: 15000,
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({
      account_id: "id-ar",
      debit_cents: 15000,
      credit_cents: 0,
    });
    expect(lines[1]).toMatchObject({
      account_id: "id-revenue",
      debit_cents: 0,
      credit_cents: 15000,
    });
    expect(balanced(lines)).toBe(true);
  });

  it("splits sales tax into its payable account", () => {
    const lines = buildInvoiceIssuedLines(accounts, {
      invoice_number: "INV-1002",
      subtotal_cents: 10000,
      tax_cents: 888,
      total_cents: 10888,
    });
    expect(lines).toHaveLength(3);
    expect(lines.find((l) => l.account_id === "id-tax")).toMatchObject({
      credit_cents: 888,
    });
    expect(lines.find((l) => l.account_id === "id-ar")).toMatchObject({
      debit_cents: 10888,
    });
    expect(balanced(lines)).toBe(true);
  });
});

describe("buildInvoicePaidLines", () => {
  it("moves the balance from A/R into checking", () => {
    const lines = buildInvoicePaidLines(accounts, {
      invoice_number: "INV-1001",
      total_cents: 15000,
    });
    expect(lines.find((l) => l.account_id === "id-checking")).toMatchObject({
      debit_cents: 15000,
    });
    expect(lines.find((l) => l.account_id === "id-ar")).toMatchObject({
      credit_cents: 15000,
    });
    expect(balanced(lines)).toBe(true);
  });
});

describe("buildDirectPaymentLines", () => {
  it("books straight to checking and revenue", () => {
    const lines = buildDirectPaymentLines(accounts, {
      amount_cents: 7500,
      description: "Airport transfer",
    });
    expect(lines.find((l) => l.account_id === "id-checking")).toMatchObject({
      debit_cents: 7500,
      description: "Airport transfer",
    });
    expect(lines.find((l) => l.account_id === "id-revenue")).toMatchObject({
      credit_cents: 7500,
    });
    expect(balanced(lines)).toBe(true);
  });

  it("falls back to a generic memo", () => {
    const lines = buildDirectPaymentLines(accounts, {
      amount_cents: 100,
      description: null,
    });
    expect(lines[0].description).toBe("Stripe payment");
  });
});
