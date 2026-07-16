"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createVendor } from "@/app/admin/books/actions";

export function VendorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [is1099, setIs1099] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSubmitting(true);
    try {
      const result = await createVendor({ name, email, phone, is_1099: is1099 });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setName("");
      setEmail("");
      setPhone("");
      setIs1099(false);
      setSaved(true);
      router.refresh();
    } catch {
      setError("Something went wrong saving the vendor. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <form
      onSubmit={onSubmit}
      className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="font-heading text-lg font-semibold text-slate-900">
        Add vendor
      </h2>

      <div>
        <label htmlFor="vendor-name" className="mb-1 block text-sm font-medium text-slate-700">
          Name <span aria-hidden="true" className="text-rose-500">*</span>
        </label>
        <input
          id="vendor-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Brooklyn Auto Repair"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="vendor-email" className="mb-1 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="vendor-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="vendor-phone" className="mb-1 block text-sm font-medium text-slate-700">
          Phone
        </label>
        <input
          id="vendor-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={is1099}
          onChange={(e) => setIs1099(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/30"
        />
        1099 contractor (track for tax reporting)
      </label>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p aria-live="polite" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Vendor added.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : null}
        Add vendor
      </button>
    </form>
  );
}
