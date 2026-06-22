import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  CalendarCheck,
  ShieldCheck,
  Accessibility,
  Clock,
  HeartHandshake,
  BadgeCheck,
  DoorOpen,
  ArrowRight,
  Star,
  MapPin,
  ClipboardCheck,
  CheckCircle2,
  Car,
} from "lucide-react";
import { site } from "@/lib/site";
import { services } from "@/lib/data/services";
import { serviceAreas } from "@/lib/data/areas";
import { faqs } from "@/lib/data/faq";
import { photos } from "@/lib/data/photos";
import { SectionHeading } from "@/components/SectionHeading";
import { Reveal } from "@/components/Reveal";
import { Testimonials } from "@/components/Testimonials";
import { FaqAccordion } from "@/components/FaqAccordion";
import { CTABanner } from "@/components/CTABanner";
import { GoogleMap } from "@/components/GoogleMap";
import { JsonLd } from "@/components/JsonLd";
import { faqJsonLd } from "@/lib/seo";

const trustItems = [
  { icon: BadgeCheck, label: "Licensed Drivers" },
  { icon: ShieldCheck, label: "Professional Service" },
  { icon: Accessibility, label: "Wheelchair Accessible" },
  { icon: Clock, label: "Reliable Scheduling" },
  { icon: DoorOpen, label: "Door-to-Door Assistance" },
  { icon: HeartHandshake, label: "Patient Focused" },
];

const steps = [
  {
    icon: ClipboardCheck,
    title: "Request a Ride",
    text: "Book online in minutes or call our team. Tell us your pickup, destination, and any mobility needs.",
  },
  {
    icon: CheckCircle2,
    title: "Receive Confirmation",
    text: "We confirm your ride by email and phone, with your driver and pickup window.",
  },
  {
    icon: Car,
    title: "Professional Pickup",
    text: "A trained driver arrives on time in a clean, fully accessible vehicle.",
  },
  {
    icon: MapPin,
    title: "Safe Arrival",
    text: "We assist you door-to-door and ensure you arrive safely and on schedule.",
  },
];

const whyChoose = [
  "Experienced, background-checked drivers",
  "True wheelchair accessibility",
  "Reliable, on-time scheduling",
  "Clean, comfortable vehicles",
  "Professional, compassionate service",
  "Family peace of mind",
];

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />

      {/* ─── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-secondary/10 blur-3xl"
        />
        <div className="container-page grid items-center gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <Reveal>
            <div>
              <span className="eyebrow">
                <Star className="h-4 w-4 fill-current" aria-hidden /> Trusted NYC
                Medical Transportation
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-tight text-primary sm:text-5xl lg:text-6xl">
                Private Wheelchair Transportation Across New York City
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
                Safe, reliable and professional transportation for medical
                appointments, hospital discharges, dialysis treatments and
                everyday travel.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/book" className="btn-primary">
                  <CalendarCheck className="h-5 w-5" aria-hidden /> Book a Ride
                </Link>
                <a href={`tel:${site.phoneRaw}`} className="btn-outline">
                  <Phone className="h-5 w-5" aria-hidden /> Call {site.phone}
                </a>
              </div>
              <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                {[
                  { n: "24/7", l: "Availability" },
                  { n: "5★", l: "Rated Service" },
                  { n: "7+", l: "Areas Served" },
                ].map((s) => (
                  <div key={s.l}>
                    <dt className="font-heading text-2xl font-bold text-primary">
                      {s.n}
                    </dt>
                    <dd className="text-sm text-slate-500">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl bg-primary shadow-elevated">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={photos.hero.src}
                    alt={photos.hero.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                    <div>
                      <p className="text-2xl font-semibold drop-shadow">
                        Door-to-door care, every ride.
                      </p>
                      <p className="mt-2 text-slate-100 drop-shadow">
                        ADA-equipped vehicles · trained drivers · on-time, every
                        time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex w-fit rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
                    <ShieldCheck className="h-6 w-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-primary">Fully Insured</p>
                    <p className="text-sm text-slate-500">& Licensed Fleet</p>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Trust bar ────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-surface">
        <div className="container-page grid grid-cols-2 gap-6 py-10 sm:grid-cols-3 lg:grid-cols-6">
          {trustItems.map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 text-center">
              <item.icon className="h-8 w-8 text-secondary" aria-hidden />
              <span className="text-sm font-medium text-ink">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Services ─────────────────────────────────────── */}
      <section className="container-page py-24">
        <SectionHeading
          eyebrow="Our Services"
          title="Comprehensive Medical & Accessible Transportation"
          description="From recurring dialysis trips to airport transfers, every ride is delivered with medical-grade care and professionalism."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 0.05}>
              <Link
                href={s.hasPage ? `/services/${s.slug}` : "/services"}
                className="card group flex h-full flex-col"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary transition group-hover:bg-primary group-hover:text-white">
                  <s.icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                  {s.short}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="How It Works"
            title="Booking a Ride Is Simple"
            description="Four easy steps from request to safe arrival."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 0.08}>
                <div className="card relative h-full">
                  <span className="absolute right-5 top-5 font-heading text-4xl font-bold text-primary-50">
                    {i + 1}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <step.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Why choose ───────────────────────────────────── */}
      <section className="container-page py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div>
              <span className="eyebrow">Why Choose Us</span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Why Families & Healthcare Providers Choose Ride Access NYC
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                We combine the reliability hospitals demand with the warmth
                families deserve. Every detail is built around passenger safety,
                comfort, and dignity.
              </p>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {whyChoose.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
                    <span className="text-ink">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/book" className="btn-primary">
                  Book a Ride
                </Link>
                <Link href="/about" className="btn-outline">
                  Learn About Us
                </Link>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: ShieldCheck, t: "Safety First", d: "Four-point securement & trained staff." },
                { icon: Clock, t: "Always On Time", d: "Dependable scheduling you can rely on." },
                { icon: HeartHandshake, t: "Compassionate", d: "Patient, respectful, person-first care." },
                { icon: Accessibility, t: "Truly Accessible", d: "Lift & ramp-equipped modern fleet." },
              ].map((c) => (
                <div key={c.t} className="card">
                  <c.icon className="h-8 w-8 text-secondary" aria-hidden />
                  <h3 className="mt-3 text-base font-semibold">{c.t}</h3>
                  <p className="mt-1 text-sm text-slate-600">{c.d}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Care / trust gallery ─────────────────────────── */}
      <section className="bg-primary py-24 text-white">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl shadow-elevated">
              <div className="relative aspect-[5/4]">
                <Image
                  src={photos.care.src}
                  alt={photos.care.alt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div>
              <span className="eyebrow border-white/20 bg-white/10 text-white">
                Compassionate Care
              </span>
              <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
                Real people, real care — every step of the journey
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-slate-100">
                Behind every ride is a trained, compassionate professional who
                treats your loved ones with the dignity and patience they
                deserve. From the front door to the appointment and back, you
                are never alone.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {photos.gallery.map((p) => (
                  <div
                    key={p.src}
                    className="relative aspect-square overflow-hidden rounded-2xl ring-2 ring-white/20"
                  >
                    <Image
                      src={p.src}
                      alt={p.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="Testimonials"
            title="Trusted by Families & Care Teams"
            description="Real experiences from the passengers and professionals we serve."
          />
          <div className="mt-14">
            <Testimonials />
          </div>
        </div>
      </section>

      {/* ─── Service areas ────────────────────────────────── */}
      <section className="container-page py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Service Areas"
              title="Serving the Entire NYC Metro Area"
              description="From the five boroughs to Long Island and Westchester, we bring accessible transportation to your door."
            />
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {serviceAreas.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/service-areas/${a.slug}`}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-ink transition hover:border-secondary hover:text-primary"
                  >
                    <MapPin className="h-4 w-4 text-secondary" aria-hidden />
                    {a.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Reveal delay={0.1}>
            <GoogleMap
              query="New York City Metropolitan Area"
              className="h-[420px]"
            />
          </Reveal>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section className="bg-surface py-24">
        <div className="container-page">
          <SectionHeading
            eyebrow="FAQ"
            title="Answers to Common Questions"
            description="Insurance, booking, accessibility and more — everything you need to know."
          />
          <div className="mt-14">
            <FaqAccordion items={faqs.slice(0, 6)} />
          </div>
          <p className="mt-8 text-center text-slate-600">
            Have another question?{" "}
            <Link href="/faq" className="font-semibold text-secondary hover:underline">
              See all FAQs
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="font-semibold text-secondary hover:underline">
              contact our team
            </Link>
            .
          </p>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
