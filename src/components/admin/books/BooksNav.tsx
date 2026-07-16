"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/books", label: "Overview" },
  { href: "/admin/books/expenses", label: "Expenses" },
  { href: "/admin/books/income", label: "Income" },
  { href: "/admin/books/banking", label: "Banking" },
  { href: "/admin/books/vendors", label: "Vendors" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/books/reports", label: "Reports" },
  { href: "/admin/books/journal", label: "Journal" },
  { href: "/admin/books/accounts", label: "Chart of Accounts" },
];

export function BooksNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Books sections"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1"
    >
      {tabs.map((tab) => {
        const active =
          tab.href === "/admin/books"
            ? pathname === "/admin/books"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
              active
                ? "bg-primary text-white"
                : "text-slate-600 hover:bg-surface",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
