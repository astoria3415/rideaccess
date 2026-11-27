import { cn } from "@/lib/utils";

/**
 * Black "Mobility assistance" label, styled like the category tag shown
 * on search listings: dark pill, white text.
 */
export function MobilityBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white",
        className,
      )}
    >
      Mobility assistance
    </span>
  );
}
