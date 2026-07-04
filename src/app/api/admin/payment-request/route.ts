import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { sendPaymentRequest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  bookingId: z.string().uuid(),
  amountCents: z.number().int().min(500, "Minimum quote is $5.00."),
});

export async function POST(req: Request) {
  const supabase = await createClient();

  // Auth: must be a logged-in admin.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 422 },
    );
  }

  const { bookingId, amountCents } = parsed.data;

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, booking_number, passenger_name, email")
    .eq("id", bookingId)
    .single();
  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const result = await sendPaymentRequest({
    passengerName: booking.passenger_name,
    email: booking.email,
    bookingId: booking.id,
    bookingNumber: booking.booking_number,
    amountCents,
  });
  if (!result.sent) {
    return NextResponse.json(
      { error: result.error ?? "Email could not be sent." },
      { status: 502 },
    );
  }

  // Record the quoted amount so payment tracking shows what's expected.
  await supabase
    .from("bookings")
    .update({ amount_cents: amountCents })
    .eq("id", bookingId);

  return NextResponse.json({ ok: true });
}
