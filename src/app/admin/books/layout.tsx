import type { Metadata } from "next";
import { BooksNav } from "@/components/admin/books/BooksNav";

export const metadata: Metadata = {
  title: "Books — Admin Dashboard",
  robots: { index: false, follow: false },
};

export default function BooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-slate-900">
          Books
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Double-entry accounting for Ride Access NYC.
        </p>
      </div>
      <BooksNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
