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
