import { NextResponse } from "next/server";
import { z } from "zod";
import { getBookingQuote } from "@/lib/booking-quote";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: returns only the quoted amount and booking number for a booking. */
export async function GET(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`quote:${ip}`, { limit: 30, windowMs: 60_000 }).success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const id = new URL(req.url).searchParams.get("booking") ?? "";
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ state: "not_found" }, { status: 404 });
  }

  const quote = await getBookingQuote(id);
  if (quote.state === "not_found") {
    return NextResponse.json({ state: "not_found" }, { status: 404 });
  }
  if (quote.state === "ready") {
    return NextResponse.json({
      state: "ready",
      bookingNumber: quote.bookingNumber,
      amountCents: quote.amountCents,
    });
  }
  return NextResponse.json({
    state: quote.state,
    bookingNumber: quote.bookingNumber,
  });
}
