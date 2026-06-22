import Stripe from "stripe";

/**
 * Server-side Stripe singleton. SERVER-ONLY — never import in a
 * client component.
 */
let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeSingleton) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set.");
    }
    stripeSingleton = new Stripe(key, {
      // Pin to the SDK's default API version to stay in sync with types.
      typescript: true,
      appInfo: { name: "Ride Access NYC", version: "1.0.0" },
    });
  }
  return stripeSingleton;
}
