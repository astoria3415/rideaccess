import Link from "next/link";
import { XCircle, CreditCard, Phone } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Payment Cancelled",
  description: "Your payment was not completed.",
  path: "/payment/cancelled",
});

export default function PaymentCancelledPage() {
  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <XCircle className="h-12 w-12" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Payment Cancelled</h1>
      <p className="mt-3 max-w-md text-lg text-slate-600">
        No charge was made. You can try again, or contact us if you need help
        completing your payment.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/payment" className="btn-primary">
          <CreditCard className="h-5 w-5" aria-hidden /> Try Again
        </Link>
        <a href={`tel:${site.phoneRaw}`} className="btn-outline">
          <Phone className="h-5 w-5" aria-hidden /> {site.phone}
        </a>
      </div>
    </section>
  );
}
