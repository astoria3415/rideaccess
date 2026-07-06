import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentReceipt } from "@/lib/email";
import { sendPushToAdmins } from "@/lib/push";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  // Updated variable name to match standard Netlify configurations
  const secret = process.env.STRIPE_WEBHOOK_SECRET; 

  // Added console.error logs so guard clauses don't exit silently
  if (!sig) {
    console.error("[webhook error] Missing stripe-signature header.");
    return NextResponse.json(
      { error: "Stripe signature missing." },
      { status: 400 }
    );
  }

  if (!secret) {
    console.error("[webhook error] STRIPE_WEBHOOK_SECRET environment variable is missing on Netlify.");
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 } // Changing to 500 since this is a server configuration issue
    );
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook error] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  console.log(`[webhook success] Verified event received: ${event.type}`);
  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId || null;
      const amount = session.amount_total ?? 0;
      const email = session.customer_details?.email ?? session.customer_email;
      const description = session.metadata?.description ?? "Transportation payment";

      // Idempotency check
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session", session.id)
        .maybeSingle();
      if (existing) {
        console.log(`[webhook] Duplicate event skipped for session: ${session.id}`);
        return NextResponse.json({ received: true, duplicate: true });
      }

      const { data: payment, error: paymentErr } = await supabase
        .from("payments")
        .insert({
          booking_id: bookingId,
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : null,
          stripe_checkout_session: session.id,
          amount_cents: amount,
          currency: session.currency ?? "usd",
          status: "paid",
          description,
          email,
        })
        .select("id")
        .single();

      if (paymentErr) {
        console.error("[webhook error] Failed to insert payment:", paymentErr);
      }

      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            payment_status: "paid",
            booking_status: "confirmed",
            amount_cents: amount,
          })
          .eq("id", bookingId);
      }

      // Auto-generate a paid invoice
      await supabase.from("invoices").insert({
        booking_id: bookingId,
        payment_id: payment?.id ?? null,
        customer_name: session.customer_details?.name ?? "Customer",
        customer_email: email,
        line_items: [
          { description, quantity: 1, unit_cents: amount },
        ],
        subtotal_cents: amount,
        tax_cents: 0,
        total_cents: amount,
        status: "paid",
      });

      if (email) {
        try {
          console.log(`[webhook] Attempting to send receipt email to: ${email}`);
          await sendPaymentReceipt({
            email,
            amountCents: amount,
            description,
          });
          console.log("[webhook] Receipt email sent successfully.");
        } catch (emailErr) {
          console.error("[webhook error] Failed to send receipt email:", emailErr);
        }
      }

      // Push to admin devices (owner + partner)
      try {
        await sendPushToAdmins({
          title: "Payment received",
          body: `$${(amount / 100).toFixed(2)} — ${description}`,
          url: "/admin/payments",
        });
      } catch (pushErr) {
        console.error("[webhook error] admin push failed:", pushErr);
      }
      break;
    }

    case "checkout.session.expired":
    case "payment_intent.payment_failed": {
      const obj = event.data.object as
        | Stripe.Checkout.Session
        | Stripe.PaymentIntent;
      const id =
        "id" in obj && obj.object === "checkout.session" ? obj.id : null;
      if (id) {
        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("stripe_checkout_session", id);
      }
      break;
    }

    default:
      console.log(`[webhook] Unhandled event type acknowledged: ${event.type}`);
      break;
  }

  return NextResponse.json({ received: true });
}