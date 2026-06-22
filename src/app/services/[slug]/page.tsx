import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, Phone, ArrowRight } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { CTABanner } from "@/components/CTABanner";
import { Reveal } from "@/components/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { services, getService } from "@/lib/data/services";
import {
  breadcrumbJsonLd,
  buildMetadata,
  serviceJsonLd,
} from "@/lib/seo";
import { site } from "@/lib/site";
import { photos } from "@/lib/data/photos";

export function generateStaticParams() {
  return services.filter((s) => s.hasPage).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return buildMetadata({ title: "Service", path: "/services" });
  return buildMetadata({
    title: service.title,
    description: service.description,
    path: `/services/${service.slug}`,
    keywords: [service.title.toLowerCase()],
  });
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service || !service.hasPage) notFound();

  const others = services.filter((s) => s.slug !== service.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={serviceJsonLd(service)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Services", path: "/services" },
          { name: service.title, path: `/services/${service.slug}` },
        ])}
      />
      <PageHero
        title={service.title}
        subtitle={service.short}
        breadcrumbs={[
          { name: "Services", href: "/services" },
          { name: service.title, href: `/services/${service.slug}` },
        ]}
      />

      <section className="container-page grid gap-12 py-16 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="relative mb-8 overflow-hidden rounded-3xl shadow-card">
            <div className="relative aspect-[16/7]">
              <Image
                src={photos.services.src}
                alt={photos.services.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover"
              />
            </div>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary">
            <service.icon className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="mt-6 text-2xl font-bold">
            Premium {service.title.toLowerCase()} you can count on
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            {service.description}
          </p>

          <h3 className="mt-10 text-xl font-semibold">What&apos;s included</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {service.features.map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-xl bg-surface p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                <span className="text-ink">{f}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/book" className="btn-primary">
              Book This Service
            </Link>
            <a href={`tel:${site.phoneRaw}`} className="btn-outline">
              <Phone className="h-5 w-5" aria-hidden /> {site.phone}
            </a>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card bg-primary text-white">
            <h3 className="text-lg font-semibold text-white">Ready to ride?</h3>
            <p className="mt-2 text-slate-100">
              Book online or call our team for same-day and recurring
              scheduling.
            </p>
            <Link href="/book" className="btn mt-4 w-full bg-white text-primary hover:bg-slate-100">
              Book a Ride
            </Link>
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold">Other services</h3>
            <ul className="mt-4 space-y-2">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={o.hasPage ? `/services/${o.slug}` : "/services"}
                    className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface"
                  >
                    {o.title}
                    <ArrowRight className="h-4 w-4 text-secondary" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <CTABanner />
    </>
  );
}
