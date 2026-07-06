import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Web Push for the admin PWA. Fail-soft like SMS/email — if VAPID keys
 * are missing or a send errors, we log and continue so a booking, contact
 * request, or payment is never lost because of a notification hiccup.
 *
 * A single call fans the message out to EVERY stored subscription, so the
 * owner and his partner are both alerted at the same time.
 */

let configured = false;

function configure(): boolean {
  if (configured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:contact@rideaccessnyc.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export function getVapidPublicKey(): string {
  return (
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
    process.env.VAPID_PUBLIC_KEY ??
    ""
  );
}

export interface PushMessage {
  title: string;
  body: string;
  /** Admin path opened when the notification is tapped. Defaults to /admin. */
  url?: string;
}

export async function sendPushToAdmins(message: PushMessage) {
  if (!configure()) {
    console.warn("[push] skipped — VAPID keys not configured");
    return { ok: false as const, error: "not configured" };
  }

  const supabase = createAdminClient();
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (error) {
    console.error("[push] could not load subscriptions", error);
    return { ok: false as const, error };
  }
  if (!subs || subs.length === 0) {
    return { ok: true as const, sent: 0 };
  }

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url ?? "/admin",
  });

  const stale: string[] = [];
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (err) {
        const code =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode?: number }).statusCode
            : undefined;
        // 404 / 410 mean the browser dropped the subscription — prune it.
        if (code === 404 || code === 410) {
          stale.push(s.id);
        } else {
          console.error("[push] send failed", code, err);
        }
      }
    }),
  );

  if (stale.length) {
    await supabase.from("push_subscriptions").delete().in("id", stale);
  }

  return { ok: true as const, sent };
}
