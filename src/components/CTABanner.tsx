import Link from "next/link";
import { Phone, CalendarCheck } from "lucide-react";
import { site } from "@/lib/site";

export function CTABanner({
  title = "Need Safe Transportation Today?",
  subtitle = "Our team is ready to help. Call now or book your ride online in minutes.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="container-page my-24">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary-600 to-secondary px-6 py-16 text-center shadow-elevated sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
        />
        <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
          {title}
        </h2>
        <p className="relative mx-auto mt-4 max-w-2xl text-lg text-slate-100">
          {subtitle}
        </p>
        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a href={`tel:${site.phoneRaw}`} className="btn-accent w-full sm:w-auto">
            <Phone className="h-5 w-5" aria-hidden /> Call {site.phone}
          </a>
          <Link href="/book" className="btn bg-white text-primary hover:bg-slate-100 w-full sm:w-auto">
            <CalendarCheck className="h-5 w-5" aria-hidden /> Book Online
          </Link>
        </div>
      </div>
    </section>
  );
}
