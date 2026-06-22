import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPaymentReceipt } from "@/lib/email";

export const runtime = "nodejs";
// Stripe needs the raw body for signature verification.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 400 },
    );
  }

  const body = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.bookingId || null;
      const amount = session.amount_total ?? 0;
      const email = session.customer_details?.email ?? session.customer_email;
      const description = session.metadata?.description ?? "Transportation payment";

      // Idempotency: if we've already recorded this session, stop here
      // so Stripe retries don't create duplicate payments/invoices.
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("stripe_checkout_session", session.id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const { data: payment } = await supabase
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

      if (bookingId) {
        await supabase
          .from("bookings")
          .update({ payment_status: "paid", amount_cents: amount })
          .eq("id", bookingId);
      }

      // Auto-generate a paid invoice for this transaction.
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
        await sendPaymentReceipt({
          email,
          amountCents: amount,
          description,
        });
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
      // Unhandled event types are acknowledged so Stripe stops retrying.
      break;
  }

  return NextResponse.json({ received: true });
}
