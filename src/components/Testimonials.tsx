import Image from "next/image";
import { Star, Quote } from "lucide-react";
import { testimonials } from "@/lib/data/testimonials";
import { Reveal } from "./Reveal";

export function Testimonials() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((t, i) => (
        <Reveal key={t.name} delay={i * 0.05}>
          <figure className="card flex h-full flex-col">
            <Quote className="h-8 w-8 text-accent/40" aria-hidden />
            <blockquote className="mt-3 flex-1 leading-relaxed text-slate-700">
              “{t.quote}”
            </blockquote>
            <div
              className="mt-4 flex gap-0.5"
              aria-label={`${t.rating} out of 5 stars`}
            >
              {Array.from({ length: t.rating }).map((_, s) => (
                <Star
                  key={s}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                  aria-hidden
                />
              ))}
            </div>
            <figcaption className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
              <Image
                src={t.image}
                alt={`${t.name}, Ride Access NYC passenger`}
                width={56}
                height={56}
                className="h-14 w-14 flex-none rounded-full object-cover ring-2 ring-accent/20"
              />
              <div>
                <p className="font-semibold text-primary">{t.name}</p>
                <p className="text-sm text-slate-500">
                  {t.role} · {t.location}
                </p>
              </div>
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
