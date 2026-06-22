import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Crumb {
  name: string;
  href: string;
}

export function PageHero({
  title,
  subtitle,
  breadcrumbs = [],
}: {
  title: string;
  subtitle?: string;
  breadcrumbs?: Crumb[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-primary-50 to-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-secondary/10 blur-3xl"
      />
      <div className="container-page py-14 lg:py-20">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
              <li>
                <Link href="/" className="hover:text-primary">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((c, i) => (
                <li key={c.href} className="flex items-center gap-1">
                  <ChevronRight className="h-4 w-4" aria-hidden />
                  {i === breadcrumbs.length - 1 ? (
                    <span className="font-medium text-primary">{c.name}</span>
                  ) : (
                    <Link href={c.href} className="hover:text-primary">
                      {c.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="max-w-3xl text-4xl font-bold text-primary sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
