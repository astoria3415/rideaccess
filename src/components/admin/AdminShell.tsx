"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Star,
  CreditCard,
  FileText,
  LogOut,
  Settings,
  Accessibility,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/contacts", label: "Contact Requests", icon: MessageSquare },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/testimonials", label: "Testimonials", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  children,
  email,
  role,
}: {
  children: React.ReactNode;
  email: string;
  role: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-20 shrink-0 items-center gap-2 border-b border-slate-100 px-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
            <Accessibility className="h-6 w-6" aria-hidden />
          </span>
          <span className="font-heading font-bold text-primary">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-primary text-white"
                    : "text-slate-600 hover:bg-surface",
                )}
              >
                <item.icon className="h-5 w-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-slate-100 bg-white p-4">
          <p className="truncate text-xs text-slate-500">{email}</p>
          <p className="text-xs font-semibold uppercase text-secondary">{role}</p>
          <button onClick={signOut} className="btn-outline mt-3 w-full py-2 text-sm">
            <LogOut className="h-4 w-4" aria-hidden /> Sign Out
          </button>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6 text-primary" />
          </button>
          <span className="font-heading font-bold text-primary">Admin</span>
          <button onClick={signOut} aria-label="Sign out">
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
