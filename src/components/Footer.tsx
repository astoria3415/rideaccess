import Link from "next/link";
import { Mail, MapPin, Phone, Accessibility } from "lucide-react";
import { site } from "@/lib/site";
import { services } from "@/lib/data/services";
import { serviceAreas } from "@/lib/data/areas";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-primary-800 text-slate-200">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
              <Accessibility className="h-6 w-6" aria-hidden />
            </span>
            <span className="font-heading text-lg font-bold text-white">
              Ride Access NYC
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Premium private wheelchair and non-emergency medical transportation
            across New York City and the surrounding metro area.
          </p>
          <div className="mt-5 space-y-2 text-sm">
            <a href={`tel:${site.phoneRaw}`} className="flex items-center gap-2 hover:text-white">
              <Phone className="h-4 w-4 text-accent" aria-hidden /> {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2 hover:text-white">
              <Mail className="h-4 w-4 text-accent" aria-hidden /> {site.email}
            </a>
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" aria-hidden /> Serving the
              NYC Metro Area
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Services
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {services.slice(0, 6).map((s) => (
              <li key={s.slug}>
                <Link
                  href={s.hasPage ? `/services/${s.slug}` : "/services"}
                  className="text-slate-300 hover:text-white"
                >
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Service Areas
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {serviceAreas.map((a) => (
              <li key={a.slug}>
                <Link
                  href={`/service-areas/${a.slug}`}
                  className="text-slate-300 hover:text-white"
                >
                  {a.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white">
            Company
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              { label: "About Us", href: "/about" },
              { label: "Book a Ride", href: "/book" },
              { label: "FAQ", href: "/faq" },
              { label: "Testimonials", href: "/testimonials" },
              { label: "Blog", href: "/blog" },
              { label: "Contact", href: "/contact" },
              { label: "Accessibility Statement", href: "/accessibility" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-slate-300 hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-400 sm:flex-row">
          <p>
            © {year} {site.legalName}. All rights reserved.
          </p>
          <p>
            Private-pay transportation provider · NYC Metro Area · ADA Accessible
          </p>
        </div>
      </div>
    </footer>
  );
}
