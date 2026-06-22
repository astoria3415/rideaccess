import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  // booking
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-sky-100 text-sky-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700",
  // payment
  unpaid: "bg-slate-100 text-slate-600",
  deposit_paid: "bg-sky-100 text-sky-700",
  paid: "bg-emerald-100 text-emerald-700",
  refunded: "bg-purple-100 text-purple-700",
  failed: "bg-rose-100 text-rose-700",
  // invoice
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-sky-100 text-sky-700",
  // lead
  new: "bg-secondary/15 text-secondary-700",
  contacted: "bg-sky-100 text-sky-700",
  qualified: "bg-indigo-100 text-indigo-700",
  won: "bg-emerald-100 text-emerald-700",
  lost: "bg-rose-100 text-rose-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
        styles[status] ?? "bg-slate-100 text-slate-600",
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
