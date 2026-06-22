"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, Phone, X, ChevronDown, Accessibility } from "lucide-react";
import { site } from "@/lib/site";
import { services } from "@/lib/data/services";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Service Areas", href: "/service-areas" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label={site.name}>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
            <Accessibility className="h-6 w-6" aria-hidden />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-heading text-lg font-bold text-primary">
              Ride Access
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary">
              NYC
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Primary"
        >
          <Link href="/" className="nav-link rounded-lg px-3 py-2 text-sm font-medium text-ink hover:text-primary">
            Home
          </Link>
          <Link href="/about" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:text-primary">
            About
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <Link
              href="/services"
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink hover:text-primary"
              aria-expanded={servicesOpen}
              aria-haspopup="true"
            >
              Services <ChevronDown className="h-4 w-4" aria-hidden />
            </Link>
            {servicesOpen && (
              <div className="absolute left-0 top-full w-72 rounded-2xl border border-slate-100 bg-white p-2 shadow-card">
                {services.map((s) => (
                  <Link
                    key={s.slug}
                    href={s.hasPage ? `/services/${s.slug}` : "/services"}
                    className="flex items-start gap-3 rounded-xl px-3 py-2 hover:bg-surface"
                  >
                    <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                    <span className="text-sm font-medium text-ink">{s.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link href="/service-areas" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:text-primary">
            Service Areas
          </Link>
          <Link href="/faq" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:text-primary">
            FAQ
          </Link>
          <Link href="/contact" className="rounded-lg px-3 py-2 text-sm font-medium text-ink hover:text-primary">
            Contact
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={`tel:${site.phoneRaw}`} className="btn-outline px-4 py-2.5 text-sm">
            <Phone className="h-4 w-4" aria-hidden /> {site.phone}
          </a>
          <Link href="/book" className="btn-primary px-5 py-2.5 text-sm">
            Book a Ride
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="rounded-lg p-2 text-primary lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-slate-100 bg-white lg:hidden",
          open ? "max-h-[640px]" : "max-h-0",
          "transition-[max-height] duration-300 ease-in-out",
        )}
      >
        <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-surface"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/services"
            className="rounded-lg px-3 py-3 text-base font-medium text-ink hover:bg-surface"
            onClick={() => setOpen(false)}
          >
            Services
          </Link>
          <div className="mt-3 flex flex-col gap-2">
            <a href={`tel:${site.phoneRaw}`} className="btn-outline">
              <Phone className="h-4 w-4" aria-hidden /> Call {site.phone}
            </a>
            <Link href="/book" className="btn-primary" onClick={() => setOpen(false)}>
              Book a Ride
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
