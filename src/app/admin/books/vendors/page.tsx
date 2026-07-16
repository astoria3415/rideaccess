import { createClient } from "@/lib/supabase/server";
import type { Vendor } from "@/lib/supabase/types";
import { VendorForm } from "@/components/admin/books/VendorForm";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vendors")
    .select("*")
    .order("name");

  const vendors = (data ?? []) as Vendor[];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[24rem_1fr]">
      <VendorForm />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b border-slate-100 px-5 py-3 font-heading text-sm font-semibold uppercase tracking-wide text-slate-600">
          Vendors ({vendors.length})
        </h2>
        {vendors.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="font-medium text-slate-700">No vendors yet</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              Add the businesses you pay — gas stations, mechanics, insurers.
              Mark contractors as 1099 to make tax season painless.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 text-center font-medium">1099</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="border-b border-slate-50 transition last:border-0 hover:bg-surface"
                >
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {vendor.name}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {[vendor.email, vendor.phone].filter(Boolean).join(" · ") ||
                      "—"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {vendor.is_1099 ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        1099
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
