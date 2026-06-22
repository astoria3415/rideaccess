"use client";

import Link from "next/link";
import { Phone, MessageCircle, CalendarCheck } from "lucide-react";
import { site } from "@/lib/site";

/**
 * Persistent mobile conversion bar + floating WhatsApp button.
 * Visible on every page per the conversion-optimization spec.
 */
export function FloatingActions() {
  const waHref = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
    site.whatsappMessage,
  )}`;

  return (
    <>
      {/* Floating WhatsApp (all viewports) */}
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-elevated transition hover:scale-105 md:bottom-6"
      >
        <MessageCircle className="h-7 w-7" aria-hidden />
      </a>

      {/* Sticky bottom action bar (mobile only) */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
        <a
          href={`tel:${site.phoneRaw}`}
          className="flex items-center justify-center gap-2 py-4 font-semibold text-primary"
        >
          <Phone className="h-5 w-5" aria-hidden /> Call Now
        </a>
        <Link
          href="/book"
          className="flex items-center justify-center gap-2 bg-primary py-4 font-semibold text-white"
        >
          <CalendarCheck className="h-5 w-5" aria-hidden /> Book Ride
        </Link>
      </div>
    </>
  );
}
