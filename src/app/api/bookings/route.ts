import { NextResponse } from "next/server";
import { bookingSchema } from "@/lib/validations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendBookingConfirmation } from "@/lib/email";
import { sendSMS } from "@/lib/sms";
import { sendPushToAdmins } from "@/lib/push";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // Rate limit protection
  if (!rateLimit(`booking:${ip}`, { limit: 5, windowMs: 60_000 }).success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 }
    );
  }

  // Parse JSON
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Validate input
  const parsed = bookingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input." },
      { status: 422 }
    );
  }

  const data = parsed.data;

  // Honeypot — silently accept bots
  if (data.company) {
    return NextResponse.json({ ok: true });
  }

  // Attach logged-in user (optional)
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();

  const supabase = createAdminClient();

  // Save booking to database
  const { data: booking, error } = await supabase
  .from("bookings")
  .insert({
    user_id: user?.id ?? null,
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
    amount_cents: 0,
  })
  .select("id, booking_number")
  .single();


  if (error || !booking) {
    console.error("[bookings] insert failed", error);
    return NextResponse.json(
      {
        error:
          "We couldn't save your booking. Please call us at (929) 206-3210.",
      },
      { status: 500 }
    );
  }

  // Insert lead record
  await supabase.from("leads").insert({
    name: data.passengerName,
    email: data.email,
    phone: data.phone,
    source: "booking",
    status: "new",
    reference_id: booking.id,
  });

  // Send email confirmation
  try {
    await sendBookingConfirmation({
      passengerName: data.passengerName,
      email: data.email,
      pickupAddress: data.pickupAddress,
      destinationAddress: data.destinationAddress,
      rideDate: data.rideDate,
      rideTime: data.rideTime,
      serviceType: data.serviceType,
      wheelchairRequired: data.wheelchairRequired,
      bookingNumber: booking.booking_number,
      bookingId: booking.id,
    });
  } catch (emailError) {
    console.error("[email] distribution failed", emailError);
  }

  // SMS to customer
  try {
    await sendSMS(
      data.phone,
      `Your Ride Access NYC booking is confirmed! Booking #${booking.booking_number}. Pickup: ${data.pickupAddress}. Destination: ${data.destinationAddress}. Date: ${data.rideDate} at ${data.rideTime}.`
    );
  } catch (smsError) {
    console.error("[sms] customer sms failed", smsError);
  }

  // SMS to admin
  try {
    await sendSMS(
      "+19292063210",
      `New booking received: #${booking.booking_number}. Passenger: ${data.passengerName}. Pickup: ${data.pickupAddress}.`
    );
  } catch (smsError) {
    console.error("[sms] admin sms failed", smsError);
  }

  // Push to admin devices (owner + partner)
  try {
    await sendPushToAdmins({
      title: `New booking ${booking.booking_number}`,
      body: `${data.passengerName} · ${data.pickupAddress} → ${data.destinationAddress}`,
      url: "/admin/bookings",
    });
  } catch (pushError) {
    console.error("[push] admin push failed", pushError);
  }

  return NextResponse.json({
    ok: true,
    id: booking.id,
    bookingNumber: booking.booking_number,
    isGuest: !user,
  });
}
