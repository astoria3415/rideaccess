/**
 * Bridge between business events (invoices, Stripe payments) and the
 * general ledger.
 *
 * The line builders are pure and unit-tested. The posting helpers take
 * any Supabase client — the authed server client in admin actions, or
 * the service-role client inside the Stripe webhook — and insert the
 * entry + lines directly (the deferred DB trigger still guarantees the
 * entry balances). Every posting is idempotent on (source_type,
 * source_id), so webhook retries and repeated status flips never
 * double-book.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

// Seeded system account codes (see 20260716000000_books_foundation.sql).
export const ACCOUNTS = {
  CHECKING: "1010",
  ACCOUNTS_RECEIVABLE: "1200",
  SALES_TAX_PAYABLE: "2200",
  RIDE_REVENUE: "4000",
} as const;

export type PostingLine = {
  account_id: string;
  debit_cents: number;
  credit_cents: number;
  description: string | null;
};

export type AccountIdsByCode = Record<string, string>;

/** Invoice issued: customer owes us. Debit A/R; credit revenue (+ tax). */
export function buildInvoiceIssuedLines(
  accounts: AccountIdsByCode,
  invoice: {
    subtotal_cents: number;
    tax_cents: number;
    total_cents: number;
    invoice_number: string;
  },
): PostingLine[] {
  const memo = `Invoice ${invoice.invoice_number}`;
  const lines: PostingLine[] = [
    {
      account_id: accounts[ACCOUNTS.ACCOUNTS_RECEIVABLE],
      debit_cents: invoice.total_cents,
      credit_cents: 0,
      description: memo,
    },
    {
      account_id: accounts[ACCOUNTS.RIDE_REVENUE],
      debit_cents: 0,
      credit_cents: invoice.subtotal_cents,
      description: memo,
    },
  ];
  if (invoice.tax_cents > 0) {
    lines.push({
      account_id: accounts[ACCOUNTS.SALES_TAX_PAYABLE],
      debit_cents: 0,
      credit_cents: invoice.tax_cents,
      description: `${memo} — sales tax`,
    });
  }
  return lines;
}

/** Invoice settled: money arrived. Debit checking; credit A/R. */
export function buildInvoicePaidLines(
  accounts: AccountIdsByCode,
  invoice: { total_cents: number; invoice_number: string },
): PostingLine[] {
  const memo = `Payment for invoice ${invoice.invoice_number}`;
  return [
    {
      account_id: accounts[ACCOUNTS.CHECKING],
      debit_cents: invoice.total_cents,
      credit_cents: 0,
      description: memo,
    },
    {
      account_id: accounts[ACCOUNTS.ACCOUNTS_RECEIVABLE],
      debit_cents: 0,
      credit_cents: invoice.total_cents,
      description: memo,
    },
  ];
}

/** Direct payment with no invoice cycle: debit checking; credit revenue. */
export function buildDirectPaymentLines(
  accounts: AccountIdsByCode,
  payment: { amount_cents: number; description: string | null },
): PostingLine[] {
  const memo = payment.description ?? "Stripe payment";
  return [
    {
      account_id: accounts[ACCOUNTS.CHECKING],
      debit_cents: payment.amount_cents,
      credit_cents: 0,
      description: memo,
    },
    {
      account_id: accounts[ACCOUNTS.RIDE_REVENUE],
      debit_cents: 0,
      credit_cents: payment.amount_cents,
      description: memo,
    },
  ];
}

// ---------------------------------------------------------------------
// IO helpers
// ---------------------------------------------------------------------

// Accept any project client (typed or service-role) without dragging
// full generated Database generics through every caller.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, "public", any>;

/** Loads id lookups for the system accounts used by the bridge. */
export async function loadPostingAccounts(
  client: AnyClient,
): Promise<AccountIdsByCode | null> {
  const codes = Object.values(ACCOUNTS);
  const { data, error } = await client
    .from("ledger_accounts")
    .select("id, code")
    .in("code", codes);
  if (error || !data) return null;
  const map: AccountIdsByCode = {};
  for (const row of data as { id: string; code: string }[]) {
    map[row.code] = row.id;
  }
  // All bridge accounts must exist (they are seeded and undeletable).
  return codes.every((c) => map[c]) ? map : null;
}

async function hasEntry(
  client: AnyClient,
  sourceType: string,
  sourceId: string,
): Promise<boolean> {
  const { data } = await client
    .from("journal_entries")
    .select("id")
    .eq("source_type", sourceType)
    .eq("source_id", sourceId)
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Inserts one journal entry with its lines. Returns false (and cleans
 * up the header) if anything fails; never throws so callers can treat
 * ledger posting as best-effort alongside the primary write.
 */
async function insertEntry(
  client: AnyClient,
  input: {
    entry_date: string;
    memo: string;
    source_type: string;
    source_id: string;
    lines: PostingLine[];
  },
): Promise<boolean> {
  const { data: entry, error: entryError } = await client
    .from("journal_entries")
    .insert({
      entry_date: input.entry_date,
      memo: input.memo,
      source_type: input.source_type,
      source_id: input.source_id,
    })
    .select("id")
    .single();
  if (entryError || !entry) {
    console.error("[books] entry insert failed", entryError);
    return false;
  }

  const { error: linesError } = await client.from("journal_lines").insert(
    input.lines.map((l) => ({ ...l, entry_id: entry.id })),
  );
  if (linesError) {
    console.error("[books] lines insert failed", linesError);
    await client.from("journal_entries").delete().eq("id", entry.id);
    return false;
  }
  return true;
}

type InvoiceForPosting = {
  id: string;
  invoice_number: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  issued_date: string;
};

/** Posts the A/R + revenue entry for an issued invoice (idempotent). */
export async function postInvoiceIssued(
  client: AnyClient,
  invoice: InvoiceForPosting,
): Promise<void> {
  if (invoice.total_cents <= 0) return;
  if (await hasEntry(client, "invoice", invoice.id)) return;
  const accounts = await loadPostingAccounts(client);
  if (!accounts) {
    console.error("[books] posting accounts missing; run migrations");
    return;
  }
  await insertEntry(client, {
    entry_date: invoice.issued_date ?? new Date().toISOString().slice(0, 10),
    memo: `Invoice ${invoice.invoice_number} issued`,
    source_type: "invoice",
    source_id: invoice.id,
    lines: buildInvoiceIssuedLines(accounts, invoice),
  });
}

/**
 * Posts the settlement entry for a paid invoice (idempotent), first
 * ensuring the issued entry exists so A/R nets to zero.
 */
export async function postInvoicePaid(
  client: AnyClient,
  invoice: InvoiceForPosting,
  paidDate?: string,
): Promise<void> {
  if (invoice.total_cents <= 0) return;
  await postInvoiceIssued(client, invoice);
  if (await hasEntry(client, "invoice_payment", invoice.id)) return;
  const accounts = await loadPostingAccounts(client);
  if (!accounts) return;
  await insertEntry(client, {
    entry_date: paidDate ?? new Date().toISOString().slice(0, 10),
    memo: `Invoice ${invoice.invoice_number} paid`,
    source_type: "invoice_payment",
    source_id: invoice.id,
    lines: buildInvoicePaidLines(accounts, invoice),
  });
}

/** Posts a direct Stripe payment that has no invoice cycle (idempotent). */
export async function postDirectPayment(
  client: AnyClient,
  payment: { id: string; amount_cents: number; description: string | null },
): Promise<void> {
  if (payment.amount_cents <= 0) return;
  if (await hasEntry(client, "payment", payment.id)) return;
  const accounts = await loadPostingAccounts(client);
  if (!accounts) return;
  await insertEntry(client, {
    entry_date: new Date().toISOString().slice(0, 10),
    memo: payment.description ?? "Stripe payment",
    source_type: "payment",
    source_id: payment.id,
    lines: buildDirectPaymentLines(accounts, payment),
  });
}

/** Removes ledger entries linked to a deleted invoice. */
export async function removeInvoiceEntries(
  client: AnyClient,
  invoiceId: string,
): Promise<void> {
  await client
    .from("journal_entries")
    .delete()
    .in("source_type", ["invoice", "invoice_payment"])
    .eq("source_id", invoiceId);
}
