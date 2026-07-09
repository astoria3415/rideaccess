import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { AccessDenied } from "@/components/admin/AccessDenied";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
  // Admin-scoped PWA: manifest + apple-touch icon are linked here only, so
  // the public marketing site is never installable.
  manifest: "/api/admin/webmanifest",
  // Icons served from the unguarded /api tree so they always resolve when the
  // browser installs the app to the home screen.
  icons: {
    icon: "/api/admin/pwa-icon/192",
    apple: "/api/admin/pwa-icon/180",
  },
  appleWebApp: {
    capable: true,
    title: "RA Admin",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0F4C81",
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

  if (!user) {
    return <>{children}</>;
  }

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
