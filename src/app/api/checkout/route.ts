import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validations";
import { site } from "@/lib/site";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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

  const { amount, description, email, bookingId } = parsed.data;
  const origin =
    req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? site.url;

  try {
    const stripe = getStripe();
    
    // Creating the Checkout Session without hardcoded payment methods 
    // lets Stripe handle Apple Pay, Google Pay, and Link automatically.
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
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
        bookingId: bookingId ?? "", 
        description: description ?? "" 
      },
      automatic_tax: { enabled: false },
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/payment/cancelled`,
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