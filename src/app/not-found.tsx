import Link from "next/link";
import { Home, Phone } from "lucide-react";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="font-heading text-6xl font-bold text-primary-100">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page Not Found</h1>
      <p className="mt-3 max-w-md text-lg text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist. Let&apos;s get you
        back on the road.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-primary">
          <Home className="h-5 w-5" aria-hidden /> Back Home
        </Link>
        <a href={`tel:${site.phoneRaw}`} className="btn-outline">
          <Phone className="h-5 w-5" aria-hidden /> {site.phone}
        </a>
      </div>
    </section>
  );
}
