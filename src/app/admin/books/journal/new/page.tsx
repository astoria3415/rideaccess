import { createClient } from "@/lib/supabase/server";
import type { LedgerAccount } from "@/lib/supabase/types";
import { JournalEntryForm } from "@/components/admin/books/JournalEntryForm";

export const dynamic = "force-dynamic";

export default async function NewJournalEntryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ledger_accounts")
    .select("id, code, name, type")
    .eq("is_archived", false)
    .order("code");

  const accounts = (data ?? []) as Pick<
    LedgerAccount,
    "id" | "code" | "name" | "type"
  >[];

  return (
    <div className="max-w-3xl">
      <JournalEntryForm accounts={accounts} />
    </div>
  );
}
