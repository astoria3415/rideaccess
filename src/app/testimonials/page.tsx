import { PageHero } from "@/components/PageHero";
import { Testimonials } from "@/components/Testimonials";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Testimonials",
  description:
    "Read what Ride Access NYC passengers say about our wheelchair-accessible transportation in New York City and beyond.",
  path: "/testimonials",
});

export default function TestimonialsPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([{ name: "Testimonials", path: "/testimonials" }])}
      />
      <PageHero
        title="What Our Passengers Say"
        subtitle="Real words from real Ride Access NYC passengers."
        breadcrumbs={[{ name: "Testimonials", href: "/testimonials" }]}
      />
      <section className="container-page py-16">
        <Testimonials />
      </section>
      <CTABanner />
    </>
  );
}
