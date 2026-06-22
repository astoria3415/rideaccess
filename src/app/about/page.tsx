import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  HeartHandshake,
  Accessibility,
  Clock,
  Users,
  Award,
} from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { photos } from "@/lib/data/photos";

export const metadata = buildMetadata({
  title: "About Us",
  description:
    "Ride Access NYC is a premium private wheelchair and medical transportation provider serving New York City with safety, compassion, and reliability.",
  path: "/about",
});

const values = [
  { icon: ShieldCheck, t: "Safety", d: "Every vehicle, driver, and procedure is built around passenger safety." },
  { icon: HeartHandshake, t: "Compassion", d: "We treat every passenger with the dignity and patience they deserve." },
  { icon: Clock, t: "Reliability", d: "On-time, every time — because your appointments can't wait." },
  { icon: Accessibility, t: "Accessibility", d: "True wheelchair accessibility with lift and ramp-equipped vehicles." },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "About", path: "/about" }])} />
      <PageHero
        title="About Ride Access NYC"
        subtitle="A premium transportation company built around one belief: getting to care should never be the hardest part of someone's day."
        breadcrumbs={[{ name: "About", href: "/about" }]}
      />

      <section className="container-page grid items-center gap-12 py-16 lg:grid-cols-2">
        <Reveal>
          <div>
            <span className="eyebrow">Our Story</span>
            <h2 className="mt-4 text-3xl font-bold">
              Transportation, reimagined around the passenger
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-slate-600">
              <p>
                Ride Access NYC was founded to solve a problem too many families
                know firsthand: arranging safe, dependable transportation for a
                loved one who uses a wheelchair or needs extra assistance.
              </p>
              <p>
                We deliver medical-grade reliability with the warmth of a family
                member. Our drivers are trained, background-checked, and
                genuinely care. Our vehicles are clean, modern, and fully
                accessible. And our scheduling is built so you never have to
                worry whether your ride will show up.
              </p>
              <p>
                From recurring dialysis trips to hospital discharges, airport
                transfers, and everyday errands, we&apos;re proud to be the
                transportation partner New York families and healthcare
                providers trust.
              </p>
            </div>
            <Link href="/book" className="btn-primary mt-8">
              Book Your Ride
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div>
            <div className="relative mb-4 overflow-hidden rounded-3xl shadow-elevated">
              <div className="relative aspect-[4/3]">
                <Image
                  src={photos.about.src}
                  alt={photos.about.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Users, n: "1,000s", l: "Rides delivered" },
              { icon: Award, n: "5★", l: "Average rating" },
              { icon: Accessibility, n: "100%", l: "Accessible fleet" },
              { icon: Clock, n: "24/7", l: "Availability" },
            ].map((s) => (
              <div key={s.l} className="card text-center">
                <s.icon className="mx-auto h-9 w-9 text-secondary" aria-hidden />
                <p className="mt-3 font-heading text-3xl font-bold text-primary">
                  {s.n}
                </p>
                <p className="text-sm text-slate-500">{s.l}</p>
              </div>
            ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-surface py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Our Values"
            title="What Drives Every Ride"
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal key={v.t} delay={i * 0.06}>
                <div className="card h-full text-center">
                  <v.icon className="mx-auto h-10 w-10 text-secondary" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{v.t}</h3>
                  <p className="mt-2 text-sm text-slate-600">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Experience the Ride Access Difference"
        subtitle="Join the thousands of New Yorkers who trust us with their care transportation."
      />
    </>
  );
}
