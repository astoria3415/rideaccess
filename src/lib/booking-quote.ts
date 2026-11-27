import { createAdminClient } from "@/lib/supabase/admin";

/** Smallest quote we treat as real. New bookings start at 0 (no quote yet). */
export const MIN_QUOTE_CENTS = 500;

export type BookingQuote =
  | { state: "not_found" }
  | { state: "no_quote"; bookingNumber: string }
  | { state: "paid"; bookingNumber: string }
  | {
      state: "ready";
      bookingId: string;
      bookingNumber: string;
      amountCents: number;
      email: string;
    };

/**
 * Look up the amount the business quoted for a booking. SERVER-ONLY.
 * The price customers pay always comes from here, never from the browser.
 */
export async function getBookingQuote(bookingId: string): Promise<BookingQuote> {
  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_number, email, amount_cents, payment_status")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) return { state: "not_found" };
  if (booking.payment_status === "paid") {
    return { state: "paid", bookingNumber: booking.booking_number };
  }
  const amount = booking.amount_cents ?? 0;
  if (amount < MIN_QUOTE_CENTS) {
    return { state: "no_quote", bookingNumber: booking.booking_number };
  }
  return {
    state: "ready",
    bookingId: booking.id,
    bookingNumber: booking.booking_number,
    amountCents: amount,
    email: booking.email,
  };
}
