import { PageHero } from "@/components/PageHero";
import { LegalSection } from "@/components/LegalContent";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Accessibility Statement",
  description:
    "Ride Access NYC is committed to accessibility in our vehicles, service, and website (WCAG 2.1 AA).",
  path: "/accessibility",
});

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        title="Accessibility Statement"
        subtitle="Accessibility is at the heart of everything we do."
        breadcrumbs={[{ name: "Accessibility", href: "/accessibility" }]}
      />
      <div className="container-page max-w-3xl py-16">
        <p className="leading-relaxed text-slate-600">
          {site.name} is committed to ensuring our services and digital
          experience are accessible to everyone, including people with
          disabilities.
        </p>

        <LegalSection heading="Accessible Transportation">
          <p>
            Our fleet includes ADA-equipped vehicles with hydraulic lifts or
            ramps and four-point securement systems. Drivers are trained in safe
            transfer and assistance, and we provide door-to-door and
            door-through-door support.
          </p>
        </LegalSection>

        <LegalSection heading="Website Accessibility">
          <p>
            We strive to conform to the Web Content Accessibility Guidelines
            (WCAG) 2.1 Level AA. This includes keyboard navigation, screen-reader
            support, high color contrast, descriptive labels, visible focus
            states, and respect for reduced-motion preferences.
          </p>
        </LegalSection>

        <LegalSection heading="Ongoing Effort">
          <p>
            Accessibility is an ongoing commitment. We continually review and
            improve our website and services to remove barriers.
          </p>
        </LegalSection>

        <LegalSection heading="Feedback">
          <p>
            If you encounter any accessibility barrier on our website or have
            suggestions, please contact us at {site.email} or {site.phone}. We
            welcome your feedback and will work to address it promptly.
          </p>
        </LegalSection>
      </div>
    </>
  );
}
