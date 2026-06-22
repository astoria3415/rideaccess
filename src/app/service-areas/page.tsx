import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { GoogleMap } from "@/components/GoogleMap";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { serviceAreas } from "@/lib/data/areas";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Service Areas",
  description:
    "Ride Access NYC serves Manhattan, Brooklyn, Queens, the Bronx, Staten Island, Long Island and Westchester with accessible medical transportation.",
  path: "/service-areas",
});

export default function ServiceAreasPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Service Areas", path: "/service-areas" }])}
      />
      <PageHero
        title="Where We Serve"
        subtitle="Accessible medical transportation across the five boroughs, Long Island, and Westchester County."
        breadcrumbs={[{ name: "Service Areas", href: "/service-areas" }]}
      />

      <section className="container-page py-16">
        <GoogleMap query="New York City Metropolitan Area" className="h-[360px]" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {serviceAreas.map((a, i) => (
            <Reveal key={a.slug} delay={(i % 3) * 0.05}>
              <Link href={`/service-areas/${a.slug}`} className="card group flex h-full flex-col">
                <span className="flex items-center gap-2 text-secondary">
                  <MapPin className="h-5 w-5" aria-hidden />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {a.region}
                  </span>
                </span>
                <h2 className="mt-3 text-xl font-semibold">{a.name}</h2>
                <p className="mt-2 flex-1 text-sm text-slate-600">{a.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                  View {a.name}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <CTABanner />
    </>
  );
}
