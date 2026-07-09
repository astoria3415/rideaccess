import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, GraduationCap } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { Reveal } from "@/components/Reveal";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { services } from "@/lib/data/services";
import { photos } from "@/lib/data/photos";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Our Services",
  description:
    "Wheelchair transportation, dialysis transport, hospital discharge, airport transfers, senior transportation and more across the NYC metro area.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Services", path: "/services" }])} />
      <PageHero
        title="Our Transportation Services"
        subtitle="Comprehensive, accessible, medical-grade transportation tailored to every passenger's needs."
        breadcrumbs={[{ name: "Services", href: "/services" }]}
      />

      <section className="container-page space-y-6 py-16">
        {services.map((s, i) => (
          <Reveal key={s.slug} delay={(i % 2) * 0.05}>
            <article className="card grid gap-6 md:grid-cols-[3rem_1fr_auto] md:items-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
                <s.icon className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{s.title}</h2>
                <p className="mt-1 text-slate-600">{s.short}</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
                  {s.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-sm text-slate-500">
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex gap-3">
                {s.hasPage && (
                  <Link href={`/services/${s.slug}`} className="btn-outline whitespace-nowrap">
                    Details <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                )}
                <Link href="/book" className="btn-primary whitespace-nowrap">
                  Book
                </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </section>

      <section className="bg-primary-50/40 py-16">
        <div className="container-page">
          <Reveal>
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary">
                  <GraduationCap className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="mt-4 text-2xl font-semibold">
                  Private Trips for Disabled Students
                </h2>
                <p className="mt-3 text-slate-600">
                  Safe, dependable door-to-door transportation for students with
                  disabilities — to and from school, therapy, and after-school
                  programs. Our trained drivers provide wheelchair-accessible
                  vehicles and patient, hands-on boarding assistance so families
                  and schools can count on every ride.
                </p>
                <ul className="mt-4 space-y-2">
                  {[
                    "Wheelchair-accessible vans with ramps",
                    "Trained, background-checked drivers",
                    "Reliable pickup and drop-off scheduling",
                    "Door-to-door boarding assistance",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/book" className="btn-primary mt-6 inline-flex">
                  Book a Student Ride <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {photos.students.map((p) => (
                  <div key={p.src} className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-md">
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
