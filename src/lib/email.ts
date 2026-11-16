import { Resend } from "resend";
import { site } from "./site";
import type { Invoice } from "./supabase/types";

/**
 * Transactional email via Resend. All functions fail soft — if the
 * API key is missing or sending errors, we log and continue so a
 * booking is never lost because of an email hiccup.
 */
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

// Sender must be on the verified rideaccessnyc.com domain — the Resend
// sandbox (onboarding@resend.dev) only delivers to the account owner, so
// customers would never receive their confirmation. Env values are
// quote-stripped because quoted values pasted into Vercel keep the quotes,
// which Resend rejects as an invalid from format.
const envFrom = (process.env.EMAIL_FROM ?? "").replace(/^["']|["']$/g, "").trim();
const FROM =
  envFrom && !envFrom.includes("resend.dev")
    ? envFrom
    : `${site.name} <booking@rideaccessnyc.com>`;
const ADMIN =
  (process.env.ADMIN_NOTIFY_EMAIL ?? "").replace(/^["']|["']$/g, "").trim() ||
  site.email;

const wrap = (heading: string, body: string) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="background:#0F4C81;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px">${site.name}</h1>
    </div>
    <div style="padding:28px 32px;color:#1F2937;line-height:1.6">
      <h2 style="margin-top:0;color:#0F4C81;font-size:18px">${heading}</h2>
      ${body}
    </div>
    <div style="padding:18px 32px;background:#F8FAFC;color:#64748b;font-size:13px">
      ${site.name} · ${site.phone} · ${site.email}
    </div>
  </div>`;

// Terms & Conditions / Reservation Agreement appended to the quote email so
// the customer accepts them by paying. Kept as one styled block for reuse.
const termsBlock = `
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;color:#475569;font-size:13px;line-height:1.55">
    <h3 style="color:#0F4C81;font-size:15px;margin:0 0 6px">Terms &amp; Conditions / Reservation Agreement</h3>
    <p style="margin:0 0 14px">Thank you for choosing ${site.name} for your medical and wheelchair-accessible transportation needs. We are committed to providing safe, professional, and timely service. By completing payment for this quote you agree to the terms below.</p>

    <p style="font-weight:600;color:#0F4C81;margin:0 0 4px">Reservation Guidelines</p>
    <p style="margin:0 0 4px">Please review your trip confirmation for accuracy and provide complete passenger details:</p>
    <ul style="margin:0 0 14px;padding-left:18px">
      <li>Accurate pickup / drop-off addresses</li>
      <li>Number of passengers and mobility aids (e.g. wheelchairs)</li>
      <li>Flight information (if applicable)</li>
      <li>A contact mobile number for real-time communication</li>
    </ul>

    <p style="font-weight:600;color:#0F4C81;margin:0 0 4px">Airport Pickups</p>
    <p style="margin:0 0 14px">For JFK, LGA, EWR, and other airports, please proceed directly outside the terminal exit to meet your driver. We monitor flight status to adjust for delays but appreciate timely updates from passengers when available.</p>

    <p style="font-weight:600;color:#0F4C81;margin:0 0 4px">Payment Policy</p>
    <ul style="margin:0 0 14px;padding-left:18px">
      <li>All reservations must be prepaid in advance.</li>
      <li>Drivers do not collect fares, except tips for excellent service (optional).</li>
      <li>Quoted fares include mileage, wait time, and base toll estimates. Final charges may reflect actual tolls and extras (added stops, wait time, etc.).</li>
    </ul>

    <p style="font-weight:600;color:#0F4C81;margin:0 0 4px">Cancellation &amp; Refunds</p>
    <p style="margin:0 0 4px">We understand plans change, so our cancellation policy is as follows:</p>
    <ul style="margin:0 0 4px;padding-left:18px">
      <li><strong>100% refund</strong> — if canceled at least 24 hours before pickup time</li>
      <li><strong>50% refund</strong> — if canceled 2–3 hours before pickup</li>
      <li><strong>No refund</strong> — if canceled after the driver has arrived on location</li>
    </ul>
    <p style="margin:0 0 14px">Refunds are processed within 5–7 business days.</p>

    <p style="font-weight:600;color:#0F4C81;margin:0 0 4px">Important Policies</p>
    <ul style="margin:0 0 14px;padding-left:18px">
      <li>Last-minute bookings are non-refundable.</li>
      <li>No-shows without communication will be fully charged.</li>
      <li>Passengers are responsible for any damage caused during transport.</li>
      <li>Vehicles must not exceed seating capacity. No smoking allowed. Pets must be declared in advance.</li>
    </ul>

    <p style="font-weight:600;color:#0F4C81;margin:0 0 4px">Contact Us — We're Here 24/7</p>
    <p style="margin:0">We're proud to serve the NYC metro area with wheelchair-accessible and non-emergency medical transportation. Need help? Call <strong>${site.phone}</strong> or email <a href="mailto:${site.email}" style="color:#0097A7">${site.email}</a>.</p>
  </div>`;

interface BookingEmailData {
  passengerName: string;
  email: string;
  pickupAddress: string;
  destinationAddress: string;
  rideDate: string;
  rideTime: string;
  serviceType: string;
  wheelchairRequired: boolean;
  bookingNumber: string;
  bookingId: string;
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const resend = getResend();
  if (!resend) return;

  const detailsTable = `
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b">Passenger</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.passengerName}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Service</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.serviceType}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Date</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.rideDate} at ${data.rideTime}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Pickup</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.pickupAddress}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Destination</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.destinationAddress}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Wheelchair</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.wheelchairRequired ? "Yes" : "No"}</td></tr>
    </table>`;

  const confirmationLine = `<p style="margin-top:8px;font-size:15px"><strong>Confirmation #${data.bookingNumber}</strong></p>`;

  // Customer-facing copy: warm thank-you + a request to verify the details.
  const customerBody = `
    <p>Thank you for traveling with <strong>${site.name}</strong>! Below please
    find your confirmation. If any of the information appears to be incorrect,
    please contact our office immediately at <strong>${site.phone}</strong> so
    we can correct it.</p>
    ${confirmationLine}
    ${detailsTable}`;

  // Admin-facing copy stays operational.
  const adminBody = `
    <p>A new booking request has been submitted.</p>
    ${confirmationLine}
    ${detailsTable}
    <p style="color:#64748b">Reply-to reaches the passenger at ${data.email}.</p>`;

  const payUrl = `${site.url}/payment?booking=${data.bookingId}&ref=${encodeURIComponent(data.bookingNumber)}&email=${encodeURIComponent(data.email)}`;
  const qrUrl = `${site.url}/api/qr?data=${encodeURIComponent(payUrl)}`;

  const customerExtras = `
    <div style="text-align:center;margin:24px 0 8px">
      <a href="${payUrl}" style="display:inline-block;background:#0F4C81;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px">Pay Securely Online</a>
      <p style="color:#64748b;font-size:13px;margin:14px 0 6px">Or scan to pay from your phone:</p>
      <img src="${qrUrl}" alt="QR code for booking ${data.bookingNumber} payment page" width="150" height="150" style="border:1px solid #e2e8f0;border-radius:10px"/>
    </div>`;

  try {
    // The Resend SDK reports failures in the response instead of throwing,
    // so check each result — otherwise a rejected send is invisible.
    const [customer, admin] = await Promise.all([
      resend.emails.send({
        from: FROM,
        to: data.email,
        replyTo: ADMIN,
        subject: `Your Ride Access NYC booking ${data.bookingNumber} — ${data.rideDate}`,
        html: wrap("Thank You for Your Booking", customerBody + customerExtras),
      }),
      resend.emails.send({
        from: FROM,
        to: ADMIN,
        replyTo: data.email,
        subject: `New booking: ${data.passengerName} — ${data.rideDate}`,
        html: wrap("New Booking Request", adminBody),
      }),
    ]);
    if (customer.error)
      console.error("[email] customer confirmation rejected", customer.error);
    if (admin.error)
      console.error("[email] admin notification rejected", admin.error);
  } catch (err) {
    console.error("[email] booking confirmation failed", err);
  }
}

/**
 * Email the customer a quoted price with a Stripe pay link + QR code.
 * Sent by an admin from the dashboard once a quote amount is decided.
 */
export async function sendPaymentRequest(data: {
  passengerName: string;
  email: string;
  bookingId: string;
  bookingNumber: string;
  amountCents: number;
}): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend)
    return { sent: false, error: "Email is not configured (RESEND_API_KEY missing)." };

  const amount = money(data.amountCents);
  const payUrl = `${site.url}/payment?booking=${data.bookingId}&ref=${encodeURIComponent(data.bookingNumber)}&email=${encodeURIComponent(data.email)}&amount=${(data.amountCents / 100).toFixed(2)}`;
  const qrUrl = `${site.url}/api/qr?data=${encodeURIComponent(payUrl)}`;

  const body = `
    <p>Hi ${data.passengerName}, here is the quote for your ride
    <strong>${data.bookingNumber}</strong>:</p>
    <p style="font-size:28px;font-weight:700;color:#0F4C81;margin:16px 0">${amount}</p>
    <p>You can pay securely online with card, Apple Pay, Google Pay or Link:</p>
    <div style="text-align:center;margin:24px 0 8px">
      <a href="${payUrl}" style="display:inline-block;background:#0F4C81;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:10px">Pay ${amount} Now</a>
      <p style="color:#64748b;font-size:13px;margin:14px 0 6px">Or scan to pay from your phone:</p>
      <img src="${qrUrl}" alt="QR code for booking ${data.bookingNumber} payment" width="150" height="150" style="border:1px solid #e2e8f0;border-radius:10px"/>
    </div>
    <p>Questions? Call us at <strong>${site.phone}</strong>.</p>
    ${termsBlock}`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: data.email,
      replyTo: ADMIN,
      subject: `Your quote for booking ${data.bookingNumber} — ${amount}`,
      html: wrap("Your Ride Quote", body),
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    console.error("[email] payment request failed", err);
    return { sent: false, error: err instanceof Error ? err.message : "Send failed." };
  }
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const body = `
    <p><strong>${data.name}</strong> (${data.email}, ${data.phone}) sent a message:</p>
    <p style="background:#F8FAFC;padding:14px;border-radius:10px"><strong>${data.subject}</strong><br/>${data.message}</p>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: ADMIN,
      replyTo: data.email,
      subject: `New contact form: ${data.subject}`,
      html: wrap("New Contact Request", body),
    });
  } catch (err) {
    console.error("[email] contact notification failed", err);
  }
}

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

/**
 * Email an invoice to the customer with the PDF attached. Returns
 * whether the email was actually sent so callers can surface a
 * "Resend not configured" hint in the admin UI.
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  pdf: Uint8Array,
): Promise<{ sent: boolean; error?: string }> {
  const resend = getResend();
  if (!resend) return { sent: false, error: "Email is not configured (RESEND_API_KEY missing)." };
  if (!invoice.customer_email)
    return { sent: false, error: "This invoice has no customer email." };

  const rows = invoice.line_items
    .map(
      (li) =>
        `<tr><td style="padding:6px 0;color:#1F2937">${li.description}</td><td style="padding:6px 0;text-align:right;color:#64748b">${li.quantity} × ${money(li.unit_cents)}</td><td style="padding:6px 0;text-align:right;font-weight:600">${money(li.unit_cents * li.quantity)}</td></tr>`,
    )
    .join("");

  const body = `
    <p>Hello ${invoice.customer_name}, please find your invoice
    <strong>${invoice.invoice_number}</strong> attached as a PDF.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      ${rows}
      <tr><td colspan="3" style="border-top:1px solid #e2e8f0"></td></tr>
      <tr><td colspan="2" style="padding:8px 0;color:#64748b">Total Due</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#0F4C81">${money(invoice.total_cents)}</td></tr>
    </table>
    ${invoice.notes ? `<p style="color:#64748b;font-size:13px">${invoice.notes}</p>` : ""}
    <p>You can pay securely online at <a href="${site.url}/payment">${site.url}/payment</a>.</p>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: invoice.customer_email,
      subject: `Invoice ${invoice.invoice_number} from ${site.name}`,
      html: wrap(`Invoice ${invoice.invoice_number}`, body),
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: Buffer.from(pdf),
        },
      ],
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  } catch (err) {
    console.error("[email] invoice send failed", err);
    return { sent: false, error: err instanceof Error ? err.message : "Send failed." };
  }
}

export async function sendPaymentReceipt(data: {
  email: string;
  amountCents: number;
  description: string;
}) {
  const resend = getResend();
  if (!resend) return;

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(data.amountCents / 100);

  const body = `
    <p>Thank you for your payment.</p>
    <table style="width:100%;margin:16px 0">
      <tr><td style="color:#64748b">Description</td><td style="text-align:right;font-weight:600">${data.description}</td></tr>
      <tr><td style="color:#64748b">Amount</td><td style="text-align:right;font-weight:600">${amount}</td></tr>
    </table>
    <p>A detailed receipt is also available from Stripe.</p>`;

  try {
    await resend.emails.send({
      from: FROM,
      to: data.email,
      subject: `Payment receipt — ${amount}`,
      html: wrap("Payment Confirmed", body),
    });
  } catch (err) {
    console.error("[email] payment receipt failed", err);
  }
}
