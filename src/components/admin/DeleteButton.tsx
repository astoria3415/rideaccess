"use client";

import { useState, useTransition } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { deleteRow, type DeletableTable } from "@/app/admin/actions";

export function DeleteButton({
  table,
  id,
  label = "record",
}: {
  table: DeletableTable;
  id: string;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1 text-xs">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteRow(table, id);
            })
          }
          className="rounded-full bg-red-600 px-2.5 py-1 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            "Delete"
          )}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-200"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${label}`}
      title={`Delete ${label}`}
      className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}
