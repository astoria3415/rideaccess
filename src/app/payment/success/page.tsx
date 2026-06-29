import Link from "next/link";
import { CheckCircle2, Home, CalendarCheck } from "lucide-react";
import { buildMetadata } from "@/lib/seo";
import { getStripe } from "@/lib/stripe";
import { formatCurrency } from "@/lib/utils";
// 1. Import the official Resend class directly
import { Resend } from "resend"; 

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Payment Successful",
  description: "Your payment to Ride Access NYC was successful.",
  path: "/payment/success",
});

async function getSession(sessionId?: string) {
  if (!sessionId) return null;
  try {
    const stripe = getStripe();
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  const session = await getSession(session_id);
  const amount = session?.amount_total ?? null;
  const email = session?.customer_details?.email ?? null;
  const customerName = session?.customer_details?.name ?? "Valued Customer";

  // 2. Trigger the email if a valid session exists
  if (session && email) {
    try {
      // Initialize right here using your Vercel Environment Variable
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: "Ride Access NYC <booking@rideaccessnyc.com>",
        to: [email, "astoria3415@gmail.com"],
        subject: "Ride Booking Confirmation - Ride Access NYC",
        html: `
          <h1>Booking Confirmed!</h1>
          <p>Thank you for choosing Ride Access NYC, ${customerName}.</p>
          <p>Your payment of <strong>${amount ? formatCurrency(amount) : "your fare"}</strong> has been successfully processed.</p>
          <p>Our team will contact you shortly with vehicle details and your driver assignments.</p>
        `,
      });
    } catch (emailError) {
      console.error("Resend execution error on success page:", emailError);
    }
  }

  return (
    <section className="container-page flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-12 w-12" aria-hidden />
      </span>
      <h1 className="mt-6 text-3xl font-bold sm:text-4xl">Payment Successful</h1>
      <p className="mt-3 max-w-md text-lg text-slate-600">
        Thank you! Your payment has been received
        {amount ? ` — ${formatCurrency(amount)}` : ""}. A receipt
        {email ? ` has been sent to ${email}` : " has been emailed to you"}.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn-outline">
          <Home className="h-5 w-5" aria-hidden /> Back Home
        </Link>
        <Link href="/book" className="btn-primary">
          <CalendarCheck className="h-5 w-5" aria-hidden /> Book Another Ride
        </Link>
      </div>
    </section>
  );
}