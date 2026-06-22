import { PageHero } from "@/components/PageHero";
import { LegalSection } from "@/components/LegalContent";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "How Ride Access NYC collects, uses, and protects your information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        title="Privacy Policy"
        subtitle="Last updated June 2026"
        breadcrumbs={[{ name: "Privacy Policy", href: "/privacy" }]}
      />
      <div className="container-page max-w-3xl py-16">
        <p className="leading-relaxed text-slate-600">
          {site.name} (&quot;we&quot;, &quot;us&quot;) respects your privacy.
          This policy explains what information we collect when you use our
          website or book transportation, and how we use and protect it.
        </p>

        <LegalSection heading="Information We Collect">
          <p>
            We collect the information you provide when booking a ride,
            requesting a quote, or contacting us — including your name, phone
            number, email, pickup and destination addresses, and any notes you
            share about mobility needs. Payment information is processed securely
            by Stripe; we never store full card numbers.
          </p>
        </LegalSection>

        <LegalSection heading="How We Use Your Information">
          <p>
            We use your information to schedule and provide transportation,
            communicate confirmations and reminders, process payments, respond
            to inquiries, and improve our service. We do not sell your personal
            information.
          </p>
        </LegalSection>

        <LegalSection heading="Health Information">
          <p>
            Some information you share may relate to your health or mobility. We
            treat this information as confidential and use it only to deliver
            safe, appropriate transportation.
          </p>
        </LegalSection>

        <LegalSection heading="Data Sharing">
          <p>
            We share information only with service providers who help us operate
            (such as our payment processor, email provider, and scheduling
            tools), and when required by law. These providers are bound to
            protect your information.
          </p>
        </LegalSection>

        <LegalSection heading="Data Security">
          <p>
            We use encryption (HTTPS), access controls, and reputable providers
            (Supabase, Stripe) to safeguard your data. No method of transmission
            is 100% secure, but we work to protect your information.
          </p>
        </LegalSection>

        <LegalSection heading="Your Rights">
          <p>
            You may request access to, correction of, or deletion of your
            personal information by contacting us at {site.email}.
          </p>
        </LegalSection>

        <LegalSection heading="Contact">
          <p>
            Questions about this policy? Email {site.email} or call {site.phone}.
          </p>
        </LegalSection>
      </div>
    </>
  );
}
