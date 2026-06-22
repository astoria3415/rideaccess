import { Phone, Clock, ShieldCheck, HeartHandshake } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { BookingForm } from "@/components/forms/BookingForm";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Book a Ride",
  description:
    "Book wheelchair and medical transportation across NYC in minutes. Fast, secure online booking for appointments, dialysis, hospital discharges and more.",
  path: "/book",
});

export default function BookPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Book a Ride", path: "/book" }])}
      />
      <PageHero
        title="Book a Ride"
        subtitle="Request your wheelchair or medical transportation in minutes. Our team will confirm your ride by phone and email."
        breadcrumbs={[{ name: "Book a Ride", href: "/book" }]}
      />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-[1fr_22rem]">
        <BookingForm />

        <aside className="space-y-6">
          <div className="card bg-primary text-white">
            <h2 className="text-lg font-semibold text-white">
              Prefer to book by phone?
            </h2>
            <p className="mt-2 text-slate-100">
              Our dispatch team is here to help with scheduling and special
              requests.
            </p>
            <a
              href={`tel:${site.phoneRaw}`}
              className="btn mt-4 w-full bg-white text-primary hover:bg-slate-100"
            >
              <Phone className="h-5 w-5" aria-hidden /> {site.phone}
            </a>
          </div>

          <div className="card">
            <h2 className="text-lg font-semibold">What to expect</h2>
            <ul className="mt-4 space-y-4 text-sm text-slate-600">
              {[
                { icon: Clock, t: "Quick confirmation", d: "We confirm by phone & email." },
                { icon: ShieldCheck, t: "Safe & secured", d: "ADA vehicles, trained drivers." },
                { icon: HeartHandshake, t: "Door-to-door", d: "Assistance every step of the way." },
              ].map((i) => (
                <li key={i.t} className="flex gap-3">
                  <i.icon className="h-5 w-5 shrink-0 text-secondary" aria-hidden />
                  <span>
                    <strong className="block text-ink">{i.t}</strong>
                    {i.d}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
