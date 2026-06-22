"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toggleTestimonial } from "@/app/admin/actions";

export function TestimonialToggle({
  id,
  published,
}: {
  id: string;
  published: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => toggleTestimonial(id, !published))}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
        published
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {published ? "Published" : "Hidden"}
    </button>
  );
}
