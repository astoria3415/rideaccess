import { createClient } from "@/lib/supabase/server";
import type { LedgerAccount, Vendor } from "@/lib/supabase/types";
import { ExpenseForm } from "@/components/admin/books/ExpenseForm";

export const dynamic = "force-dynamic";

export default async function NewExpensePage() {
  const supabase = await createClient();
  const [accountsRes, vendorsRes] = await Promise.all([
    supabase
      .from("ledger_accounts")
      .select("id, code, name, type, subtype")
      .eq("is_archived", false)
      .order("code"),
    supabase.from("vendors").select("id, name").order("name"),
  ]);

  const accounts = (accountsRes.data ?? []) as Pick<
    LedgerAccount,
    "id" | "code" | "name" | "type" | "subtype"
  >[];
  const vendors = (vendorsRes.data ?? []) as Pick<Vendor, "id" | "name">[];

  return (
    <div className="max-w-3xl">
      <ExpenseForm
        categoryAccounts={accounts.filter((a) => a.type === "expense")}
        paymentAccounts={accounts.filter(
          (a) =>
            (a.type === "asset" && ["cash", "bank"].includes(a.subtype ?? "")) ||
            (a.type === "liability" &&
              ["credit_card", "payable"].includes(a.subtype ?? "")),
        )}
        vendors={vendors}
      />
    </div>
  );
}
