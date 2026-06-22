import type { ReactNode } from "react";

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-primary">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-slate-600">
        {children}
      </div>
    </section>
  );
}
