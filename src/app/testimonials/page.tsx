import { PageHero } from "@/components/PageHero";
import { Testimonials } from "@/components/Testimonials";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Testimonials",
  description:
    "Read what families, patients, and healthcare professionals say about Ride Access NYC's wheelchair and medical transportation.",
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
        subtitle="Real experiences from the families and care teams who trust us every day."
        breadcrumbs={[{ name: "Testimonials", href: "/testimonials" }]}
      />
      <section className="container-page py-16">
        <Testimonials />
      </section>
      <CTABanner />
    </>
  );
}
