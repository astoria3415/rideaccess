import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AccessDenied } from "@/components/admin/AccessDenied";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The login page renders its own minimal shell.
  if (!user) {
    return <>{children}</>;
  }

  // Verify admin role. If the user is authenticated but not an admin,
  // sign-out semantics are handled client-side; here we deny access.
  const { data: admin } = await supabase
    .from("admins")
    .select("email, role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin) {
    return <AccessDenied email={user.email ?? ""} />;
  }

  return (
    <AdminShell email={admin.email ?? user.email ?? ""} role={admin.role}>
      {children}
    </AdminShell>
  );
}
