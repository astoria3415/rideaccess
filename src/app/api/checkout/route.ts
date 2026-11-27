import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";
import { site } from "@/lib/site";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getBookingQuote } from "@/lib/booking-quote";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`checkout:${ip}`, { limit: 10, windowMs: 60_000 }).success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 422 },
    );
  }

  const quote = await getBookingQuote(parsed.data.bookingId);
  if (quote.state === "not_found") {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }
  if (quote.state === "paid") {
    return NextResponse.json(
      { error: "This booking has already been paid." },
      { status: 409 },
    );
  }
  if (quote.state === "no_quote") {
    return NextResponse.json(
      {
        error: `Your quote isn't ready yet. We'll call or text you with your price. Questions? Call ${site.phone}.`,
      },
      { status: 409 },
    );
  }

  // Amount always comes from the saved quote, never from the request.
  const amount = quote.amountCents;
  const bookingId = quote.bookingId;
  const description = `Booking ${quote.bookingNumber}`;
  const email = parsed.data.email ?? quote.email;
  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? site.url;

  try {
    const stripe = getStripe();
    
    // Card only: this still enables Apple Pay / Google Pay wallets, but
    // disables Stripe Link, which confused customers by asking them to
    // verify a phone number saved in their Link profile (not our data).
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amount,
            product_data: {
              name: description,
              description: `${site.name} transportation payment`,
            },
          },
        },
      ],
      metadata: {
        bookingId,
        description,
      },
      automatic_tax: { enabled: false },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancelled?booking=${bookingId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] stripe error", err);
    return NextResponse.json(
      { error: "Payment could not be started. Please try again." },
      { status: 500 },
    );
  }
}