import { PageHero } from "@/components/PageHero";
import { LegalSection } from "@/components/LegalContent";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Terms of Service",
  description: "The terms governing your use of Ride Access NYC services.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        title="Terms of Service"
        subtitle="Last updated June 2026"
        breadcrumbs={[{ name: "Terms of Service", href: "/terms" }]}
      />
      <div className="container-page max-w-3xl py-16">
        <p className="leading-relaxed text-slate-600">
          These Terms govern your use of {site.name}&apos;s website and
          transportation services. By booking a ride you agree to these Terms.
        </p>

        <LegalSection heading="Our Services">
          <p>
            {site.name} provides private, non-emergency wheelchair and medical
            transportation. We are not an emergency medical service. For
            emergencies, call 911.
          </p>
        </LegalSection>

        <LegalSection heading="Bookings & Confirmation">
          <p>
            A booking request is not confirmed until our team confirms it by
            phone or email. We make every effort to accommodate requested times
            but cannot guarantee availability for same-day requests.
          </p>
        </LegalSection>

        <LegalSection heading="Payments">
          <p>
            Fares are quoted based on service type, distance, and scheduling.
            Payment is processed securely through Stripe. Deposits or prepayment
            may be required for certain bookings.
          </p>
        </LegalSection>

        <LegalSection heading="Cancellations">
          <p>
            Please provide as much notice as possible to cancel or change a ride.
            Contact us at {site.phone}. Late cancellation fees may apply for
            certain scheduled services.
          </p>
        </LegalSection>

        <LegalSection heading="Passenger Responsibilities">
          <p>
            Passengers must provide accurate pickup and destination information
            and disclose mobility or assistance needs so we can assign an
            appropriate vehicle. Companions and aides are welcome, space
            permitting.
          </p>
        </LegalSection>

        <LegalSection heading="Limitation of Liability">
          <p>
            To the maximum extent permitted by law, {site.name}&apos;s liability
            is limited to the amount paid for the affected ride. We are not
            liable for delays caused by traffic, weather, or circumstances beyond
            our reasonable control.
          </p>
        </LegalSection>

        <LegalSection heading="Contact">
          <p>
            Questions about these Terms? Email {site.email} or call {site.phone}.
          </p>
        </LegalSection>
      </div>
    </>
  );
}
