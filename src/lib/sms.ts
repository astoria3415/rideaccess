import twilio from "twilio";

/**
 * SMS via Twilio. Fail-soft like email — if credentials are missing or
 * the send errors, we log and continue so a booking is never lost
 * because of an SMS hiccup. The client is created lazily so a missing
 * env var can't crash the whole route at import time.
 */
function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

export async function sendSMS(to: string, message: string) {
  const client = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!client || !from) {
    console.warn("[sms] skipped — Twilio is not configured");
    return { ok: false, error: "not configured" };
  }
  try {
    await client.messages.create({ body: message, from, to });
    return { ok: true };
  } catch (error) {
    console.error("[sms] failed", error);
    return { ok: false, error };
  }
}
