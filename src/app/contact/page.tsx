import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { ContactForm } from "@/components/forms/ContactForm";
import { GoogleMap } from "@/components/GoogleMap";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contact Us",
  description:
    "Contact Ride Access NYC for wheelchair and medical transportation across New York City. Call (929) 206-3210 or send us a message.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Contact", path: "/contact" }])} />
      <PageHero
        title="Contact Ride Access NYC"
        subtitle="Questions, quotes, or partnerships — our team is ready to help."
        breadcrumbs={[{ name: "Contact", href: "/contact" }]}
      />

      <section className="container-page grid gap-10 py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">Send us a message</h2>
          <p className="mt-2 text-slate-600">
            We typically respond within one business hour.
          </p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Phone, t: "Phone", v: site.phone, href: `tel:${site.phoneRaw}` },
              { icon: Mail, t: "Email", v: site.email, href: `mailto:${site.email}` },
              { icon: MapPin, t: "Service Area", v: "NYC Metro Area" },
              { icon: Clock, t: "Hours", v: site.hours },
            ].map((c) => (
              <div key={c.t} className="card">
                <c.icon className="h-7 w-7 text-secondary" aria-hidden />
                <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {c.t}
                </p>
                {c.href ? (
                  <a href={c.href} className="mt-1 block font-medium text-primary hover:underline">
                    {c.v}
                  </a>
                ) : (
                  <p className="mt-1 font-medium text-primary">{c.v}</p>
                )}
              </div>
            ))}
          </div>
          <GoogleMap query="New York City" className="h-[320px]" />
        </div>
      </section>
    </>
  );
}
