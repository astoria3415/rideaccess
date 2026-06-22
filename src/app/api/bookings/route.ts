import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBookingConfirmation } from "@/lib/email";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  if (!rateLimit(`booking:${ip}`, { limit: 5, windowMs: 60_000 }).success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // Honeypot — silently accept bots without storing.
  if (data.company) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      passenger_name: data.passengerName,
      phone: data.phone,
      email: data.email,
      pickup_address: data.pickupAddress,
      destination_address: data.destinationAddress,
      ride_date: data.rideDate,
      ride_time: data.rideTime,
      service_type: data.serviceType,
      wheelchair_required: data.wheelchairRequired,
      round_trip: data.roundTrip,
      notes: data.notes || null,
      booking_status: "pending",
      payment_status: "unpaid",
    })
    .select("id")
    .single();

  if (error || !booking) {
    console.error("[bookings] insert failed", error);
    return NextResponse.json(
      { error: "We couldn't save your booking. Please call us at (929) 206-3210." },
      { status: 500 },
    );
  }

  // Unified lead pipeline (best-effort).
  await supabase.from("leads").insert({
    name: data.passengerName,
    email: data.email,
    phone: data.phone,
    source: "booking",
    status: "new",
    reference_id: booking.id,
  });

  await sendBookingConfirmation({
    passengerName: data.passengerName,
    email: data.email,
    pickupAddress: data.pickupAddress,
    destinationAddress: data.destinationAddress,
    rideDate: data.rideDate,
    rideTime: data.rideTime,
    serviceType: data.serviceType,
    wheelchairRequired: data.wheelchairRequired,
    bookingId: booking.id,
  });

  return NextResponse.json({ ok: true, id: booking.id });
}
