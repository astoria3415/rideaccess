"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AccessDenied({ email }: { email: string }) {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-surface px-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
        <ShieldAlert className="h-9 w-9" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-bold">Access Not Authorized</h1>
      <p className="mt-2 max-w-md text-slate-600">
        The account <strong>{email}</strong> is signed in but is not an
        authorized administrator. Contact a superadmin to be granted access.
      </p>
      <button onClick={signOut} className="btn-outline mt-6">
        <LogOut className="h-5 w-5" aria-hidden /> Sign Out
      </button>
    </div>
  );
}
