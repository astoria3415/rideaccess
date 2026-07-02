import { Suspense } from "react";
import { ShieldCheck, CreditCard, Receipt } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Make a Payment",
  description:
    "Securely pay for your ride, deposit, custom quote, or invoice with Ride Access NYC. Cards, Apple Pay, Google Pay, and Link accepted.",
  path: "/payment",
});

export default function PaymentPage() {
  return (
    <>
      <PageHero
        title="Make a Secure Payment"
        subtitle="Pay for a ride, deposit, custom quote, or invoice. All payments are encrypted and processed by Stripe."
        breadcrumbs={[{ name: "Payment", href: "/payment" }]}
      />
      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_20rem]">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <PaymentForm />
        </Suspense>
        <aside className="space-y-4">
          {[
            { icon: ShieldCheck, t: "PCI-compliant", d: "Card data never touches our servers." },
            { icon: CreditCard, t: "Multiple methods", d: "Card, Apple Pay, Google Pay & Link." },
            { icon: Receipt, t: "Instant receipt", d: "Emailed automatically on success." },
          ].map((i) => (
            <div key={i.t} className="card">
              <i.icon className="h-7 w-7 text-secondary" aria-hidden />
              <h3 className="mt-2 font-semibold">{i.t}</h3>
              <p className="text-sm text-slate-600">{i.d}</p>
            </div>
          ))}
        </aside>
      </section>
    </>
  );
}
