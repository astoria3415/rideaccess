"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { updateBookingStatus } from "@/app/admin/actions";
import type { BookingStatus } from "@/lib/supabase/types";

const OPTIONS: BookingStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
];

export function BookingStatusSelect({
  id,
  current,
}: {
  id: string;
  current: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={current}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value as BookingStatus;
          startTransition(() => updateBookingStatus(id, value));
        }}
        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium capitalize focus:border-secondary focus:outline-none"
      >
        {OPTIONS.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-secondary" />}
    </div>
  );
}
