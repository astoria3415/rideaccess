"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateEntry, type LedgerLine } from "@/lib/books/ledger";
import { aiCategory, type CategoryAccount } from "@/lib/books/categorize";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated.");
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) throw new Error("Not authorized.");
  return { supabase, user };
}

export type PostEntryResult =
  | { ok: true; entry_id: string }
  | { ok: false; error: string };

export async function postJournalEntry(input: {
  entry_date: string;
  memo: string;
  lines: LedgerLine[];
}): Promise<PostEntryResult> {
  const { supabase, user } = await requireAdmin();

  const errors = validateEntry(input.lines);
  if (errors.length > 0) {
    return { ok: false, error: errors.map((e) => e.message).join(" ") };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.entry_date)) {
    return { ok: false, error: "Invalid entry date." };
  }

  const { data, error } = await supabase.rpc("post_journal_entry", {
    p_entry_date: input.entry_date,
    p_memo: input.memo.trim() || null,
    p_lines: input.lines.map((l) => ({
      account_id: l.account_id,
      debit_cents: l.debit_cents,
      credit_cents: l.credit_cents,
      description: l.description ?? null,
    })),
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "post_journal_entry",
    entity: "journal_entries",
    entity_id: data,
    metadata: { memo: input.memo, lines: input.lines.length },
  });

  revalidatePath("/admin/books");
  revalidatePath("/admin/books/journal");
  revalidatePath("/admin/books/accounts");
  return { ok: true, entry_id: data };
}

export async function suggestExpenseCategory(
  description: string,
  vendorName: string | null,
): Promise<CategoryAccount | null> {
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("ledger_accounts")
    .select("id, code, name")
    .eq("type", "expense")
    .eq("is_archived", false)
    .order("code");
  return aiCategory(
    description.slice(0, 500),
    vendorName?.slice(0, 200) ?? null,
    (data ?? []) as CategoryAccount[],
  );
}

export type SimpleResult = { ok: true } | { ok: false; error: string };

export async function createVendor(input: {
  name: string;
  email?: string;
  phone?: string;
  is_1099?: boolean;
}): Promise<SimpleResult> {
  const { supabase, user } = await requireAdmin();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Vendor name is required." };

  const { data, error } = await supabase
    .from("vendors")
    .insert({
      name,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      is_1099: Boolean(input.is_1099),
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "create_vendor",
    entity: "vendors",
    entity_id: data.id,
    metadata: { name },
  });
  revalidatePath("/admin/books/vendors");
  return { ok: true };
}

export async function createExpense(input: {
  expense_date: string;
  amount_cents: number;
  description: string;
  vendor_id: string | null;
  new_vendor_name: string | null;
  category_account_id: string;
  payment_account_id: string;
  receipt_path: string | null;
}): Promise<SimpleResult> {
  const { supabase, user } = await requireAdmin();

  if (!DATE_RE.test(input.expense_date)) {
    return { ok: false, error: "Invalid expense date." };
  }
  if (!Number.isInteger(input.amount_cents) || input.amount_cents <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (!input.category_account_id || !input.payment_account_id) {
    return { ok: false, error: "Pick a category and a payment account." };
  }
  if (input.category_account_id === input.payment_account_id) {
    return { ok: false, error: "Category and payment account must differ." };
  }
  const description = input.description.trim();
  if (!description) return { ok: false, error: "Description is required." };

  let vendorId = input.vendor_id;
  const newVendorName = input.new_vendor_name?.trim();
  if (!vendorId && newVendorName) {
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .insert({ name: newVendorName })
      .select("id")
      .single();
    if (vendorError) return { ok: false, error: vendorError.message };
    vendorId = vendor.id;
  }

  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert({
      expense_date: input.expense_date,
      amount_cents: input.amount_cents,
      description,
      vendor_id: vendorId,
      category_account_id: input.category_account_id,
      payment_account_id: input.payment_account_id,
      receipt_url: input.receipt_path,
    })
    .select("id")
    .single();
  if (expenseError) return { ok: false, error: expenseError.message };

  const { data: entryId, error: postError } = await supabase.rpc(
    "post_journal_entry",
    {
      p_entry_date: input.expense_date,
      p_memo: description,
      p_lines: [
        {
          account_id: input.category_account_id,
          debit_cents: input.amount_cents,
          credit_cents: 0,
          description,
        },
        {
          account_id: input.payment_account_id,
          debit_cents: 0,
          credit_cents: input.amount_cents,
          description,
        },
      ],
      p_source_type: "expense",
      p_source_id: expense.id,
    },
  );
  if (postError) {
    // Keep books consistent: an expense without its ledger entry is
    // worse than no expense at all.
    await supabase.from("expenses").delete().eq("id", expense.id);
    return { ok: false, error: postError.message };
  }

  await supabase
    .from("expenses")
    .update({ journal_entry_id: entryId })
    .eq("id", expense.id);

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "create_expense",
    entity: "expenses",
    entity_id: expense.id,
    metadata: { amount_cents: input.amount_cents, description },
  });

  revalidatePath("/admin/books");
  revalidatePath("/admin/books/expenses");
  revalidatePath("/admin/books/journal");
  revalidatePath("/admin/books/accounts");
  return { ok: true };
}

export async function importBankTransactions(input: {
  account_id: string;
  rows: {
    txn_date: string;
    description: string;
    amount_cents: number;
    fingerprint: string;
  }[];
}): Promise<
  { ok: true; inserted: number; duplicates: number } | { ok: false; error: string }
> {
  const { supabase, user } = await requireAdmin();

  if (!input.account_id) return { ok: false, error: "Pick a bank account." };
  const rows = input.rows.filter(
    (r) =>
      DATE_RE.test(r.txn_date) &&
      Number.isInteger(r.amount_cents) &&
      r.amount_cents !== 0 &&
      r.fingerprint,
  );
  if (rows.length === 0) return { ok: false, error: "Nothing to import." };
  if (rows.length > 2000) {
    return { ok: false, error: "That file is too large — import at most 2,000 rows at a time." };
  }

  const batch = crypto.randomUUID();
  const { data, error } = await supabase
    .from("bank_transactions")
    .upsert(
      rows.map((r) => ({
        account_id: input.account_id,
        txn_date: r.txn_date,
        description: r.description.slice(0, 500),
        amount_cents: r.amount_cents,
        fingerprint: r.fingerprint,
        import_batch: batch,
      })),
      { onConflict: "account_id,fingerprint", ignoreDuplicates: true },
    )
    .select("id");
  if (error) return { ok: false, error: error.message };

  const inserted = data?.length ?? 0;
  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "import_bank_transactions",
    entity: "bank_transactions",
    entity_id: batch,
    metadata: { inserted, submitted: rows.length },
  });

  revalidatePath("/admin/books/banking");
  return { ok: true, inserted, duplicates: rows.length - inserted };
}

export async function categorizeBankTransaction(
  txnId: string,
  categoryAccountId: string,
): Promise<SimpleResult> {
  const { supabase, user } = await requireAdmin();
  if (!categoryAccountId) return { ok: false, error: "Pick a category." };

  const { data: txn, error: txnError } = await supabase
    .from("bank_transactions")
    .select("*")
    .eq("id", txnId)
    .single();
  if (txnError || !txn) return { ok: false, error: "Transaction not found." };
  if (txn.status !== "unmatched") {
    return { ok: false, error: "This transaction is already handled." };
  }
  if (categoryAccountId === txn.account_id) {
    return { ok: false, error: "Category must differ from the bank account." };
  }

  const amount = Math.abs(txn.amount_cents);
  // Money out: debit the category (expense), credit the bank account.
  // Money in: debit the bank account, credit the category (income).
  const lines =
    txn.amount_cents < 0
      ? [
          { account_id: categoryAccountId, debit_cents: amount, credit_cents: 0, description: txn.description },
          { account_id: txn.account_id, debit_cents: 0, credit_cents: amount, description: txn.description },
        ]
      : [
          { account_id: txn.account_id, debit_cents: amount, credit_cents: 0, description: txn.description },
          { account_id: categoryAccountId, debit_cents: 0, credit_cents: amount, description: txn.description },
        ];

  const { data: entryId, error: postError } = await supabase.rpc(
    "post_journal_entry",
    {
      p_entry_date: txn.txn_date,
      p_memo: txn.description,
      p_lines: lines,
      p_source_type: "bank_import",
      p_source_id: txn.id,
    },
  );
  if (postError) return { ok: false, error: postError.message };

  await supabase
    .from("bank_transactions")
    .update({ status: "categorized", journal_entry_id: entryId })
    .eq("id", txn.id);

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "categorize_bank_transaction",
    entity: "bank_transactions",
    entity_id: txn.id,
    metadata: { category_account_id: categoryAccountId, amount_cents: txn.amount_cents },
  });

  revalidatePath("/admin/books");
  revalidatePath("/admin/books/banking");
  revalidatePath("/admin/books/journal");
  revalidatePath("/admin/books/accounts");
  return { ok: true };
}

export async function matchBankTransaction(
  txnId: string,
  journalEntryId: string,
): Promise<SimpleResult> {
  const { supabase, user } = await requireAdmin();

  const { data: txn } = await supabase
    .from("bank_transactions")
    .select("id, status")
    .eq("id", txnId)
    .single();
  if (!txn) return { ok: false, error: "Transaction not found." };
  if (txn.status !== "unmatched") {
    return { ok: false, error: "This transaction is already handled." };
  }

  const { error } = await supabase
    .from("bank_transactions")
    .update({ status: "matched", journal_entry_id: journalEntryId })
    .eq("id", txnId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "match_bank_transaction",
    entity: "bank_transactions",
    entity_id: txnId,
    metadata: { journal_entry_id: journalEntryId },
  });

  revalidatePath("/admin/books/banking");
  return { ok: true };
}

export async function excludeBankTransaction(txnId: string): Promise<SimpleResult> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("bank_transactions")
    .update({ status: "excluded" })
    .eq("id", txnId)
    .eq("status", "unmatched");
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/books/banking");
  return { ok: true };
}

export async function recordIncome(input: {
  entry_date: string;
  amount_cents: number;
  payer: string;
  memo: string;
  deposit_account_id: string;
  income_account_id: string;
}): Promise<SimpleResult> {
  const { supabase, user } = await requireAdmin();

  if (!DATE_RE.test(input.entry_date)) {
    return { ok: false, error: "Invalid date." };
  }
  if (!Number.isInteger(input.amount_cents) || input.amount_cents <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (!input.deposit_account_id || !input.income_account_id) {
    return { ok: false, error: "Pick a deposit account and an income account." };
  }

  const payer = input.payer.trim();
  const memo =
    [payer, input.memo.trim()].filter(Boolean).join(" — ") || "Income";

  const { data: entryId, error } = await supabase.rpc("post_journal_entry", {
    p_entry_date: input.entry_date,
    p_memo: memo,
    p_lines: [
      {
        account_id: input.deposit_account_id,
        debit_cents: input.amount_cents,
        credit_cents: 0,
        description: payer || null,
      },
      {
        account_id: input.income_account_id,
        debit_cents: 0,
        credit_cents: input.amount_cents,
        description: payer || null,
      },
    ],
    p_source_type: "income",
  });
  if (error) return { ok: false, error: error.message };

  await supabase.from("audit_logs").insert({
    actor: user.id,
    action: "record_income",
    entity: "journal_entries",
    entity_id: entryId,
    metadata: { amount_cents: input.amount_cents, memo },
  });

  revalidatePath("/admin/books");
  revalidatePath("/admin/books/income");
  revalidatePath("/admin/books/journal");
  revalidatePath("/admin/books/accounts");
  return { ok: true };
}
