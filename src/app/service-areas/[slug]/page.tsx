import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MapPin, Building2, CheckCircle2, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { GoogleMap } from "@/components/GoogleMap";
import { JsonLd } from "@/components/JsonLd";
import { serviceAreas, getServiceArea } from "@/lib/data/areas";
import { services } from "@/lib/data/services";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export function generateStaticParams() {
  return serviceAreas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area) return buildMetadata({ title: "Service Area", path: "/service-areas" });
  return buildMetadata({
    title: `Wheelchair Transportation in ${area.name}`,
    description: area.intro,
    path: `/service-areas/${area.slug}`,
    keywords: [
      `wheelchair transportation ${area.name.toLowerCase()}`,
      `medical transportation ${area.name.toLowerCase()}`,
    ],
  });
}

export default async function AreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Service Areas", path: "/service-areas" },
          { name: area.name, path: `/service-areas/${area.slug}` },
        ])}
      />
      <PageHero
        title={`Wheelchair Transportation in ${area.name}`}
        subtitle={area.blurb}
        breadcrumbs={[
          { name: "Service Areas", href: "/service-areas" },
          { name: area.name, href: `/service-areas/${area.slug}` },
        ]}
      />

      <section className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_22rem]">
        <div>
          <p className="text-lg leading-relaxed text-slate-600">{area.intro}</p>

          <h2 className="mt-10 text-2xl font-bold">
            Services available in {area.name}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.slug} className="flex items-start gap-3 rounded-xl bg-surface p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                <span className="text-ink">{s.title}</span>
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-bold">Hospitals &amp; facilities we serve</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {area.landmarks.map((l) => (
              <li key={l} className="flex items-center gap-2 text-slate-700">
                <Building2 className="h-4 w-4 text-secondary" aria-hidden /> {l}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 text-2xl font-bold">Neighborhoods we cover</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {area.hubs.map((h) => (
              <span
                key={h}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary"
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {h}
              </span>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <GoogleMap query={`${area.name}, New York`} className="h-64" />
          <div className="card bg-primary text-white">
            <h3 className="text-lg font-semibold text-white">
              Book in {area.name}
            </h3>
            <p className="mt-2 text-slate-100">
              Reliable, accessible rides throughout {area.name}.
            </p>
            <Link href="/book" className="btn mt-4 w-full bg-white text-primary hover:bg-slate-100">
              Book a Ride
            </Link>
            <a href={`tel:${site.phoneRaw}`} className="btn mt-2 w-full border border-white/30 text-white hover:bg-white/10">
              <Phone className="h-4 w-4" aria-hidden /> {site.phone}
            </a>
          </div>
        </aside>
      </section>

      <CTABanner />
    </>
  );
}
