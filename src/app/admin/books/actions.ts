"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateEntry, type LedgerLine } from "@/lib/books/ledger";

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
