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

const FROM = process.env.EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`;
const ADMIN = process.env.ADMIN_NOTIFY_EMAIL ?? site.email;

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
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  const resend = getResend();
  if (!resend) return;

  const details = `
    <p>Hi ${data.passengerName}, your transportation request has been received.
    Our team will confirm your ride shortly.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:6px 0;color:#64748b">Service</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.serviceType}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Date</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.rideDate} at ${data.rideTime}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Pickup</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.pickupAddress}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Destination</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.destinationAddress}</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">Wheelchair</td><td style="padding:6px 0;text-align:right;font-weight:600">${data.wheelchairRequired ? "Yes" : "No"}</td></tr>
    </table>
    <p>Need to make a change? Call us at <strong>${site.phone}</strong>.</p>
    <p style="margin-top:8px;font-size:15px"><strong>Confirmation #${data.bookingNumber}</strong></p>`;

  try {
    await Promise.all([
      resend.emails.send({
        from: FROM,
        to: data.email,
        subject: `Your Ride Access NYC booking — ${data.rideDate}`,
        html: wrap("Booking Received", details),
      }),
      resend.emails.send({
        from: FROM,
        to: ADMIN,
        subject: `New booking: ${data.passengerName} — ${data.rideDate}`,
        html: wrap("New Booking Request", details),
      }),
    ]);
  } catch (err) {
    console.error("[email] booking confirmation failed", err);
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
