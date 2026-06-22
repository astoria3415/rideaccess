import { PageHero } from "@/components/PageHero";
import { FaqAccordion } from "@/components/FaqAccordion";
import { CTABanner } from "@/components/CTABanner";
import { JsonLd } from "@/components/JsonLd";
import { faqs } from "@/lib/data/faq";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Frequently Asked Questions",
  description:
    "Answers to common questions about wheelchair transportation, booking, insurance, accessibility, and recurring medical rides across NYC.",
  path: "/faq",
});

export default function FAQPage() {
  return (
    <>
      <JsonLd data={faqJsonLd(faqs)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "FAQ", path: "/faq" }])} />
      <PageHero
        title="Frequently Asked Questions"
        subtitle="Everything you need to know about booking, accessibility, insurance, and our service."
        breadcrumbs={[{ name: "FAQ", href: "/faq" }]}
      />
      <section className="container-page py-16">
        <FaqAccordion items={faqs} />
      </section>
      <CTABanner />
    </>
  );
}
