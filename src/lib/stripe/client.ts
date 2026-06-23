import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripe) {
    stripe = new Stripe(key, { typescript: true });
  }

  return stripe;
}

export function getStripePriceId(
  plan: "pro" | "starter",
  interval: "monthly" | "annual"
): string {
  const envKey =
    plan === "pro"
      ? interval === "annual"
        ? "STRIPE_PRICE_ID_PRO_ANNUAL"
        : "STRIPE_PRICE_ID_PRO"
      : interval === "annual"
        ? "STRIPE_PRICE_ID_STARTER_ANNUAL"
        : "STRIPE_PRICE_ID_STARTER";

  const priceId = process.env[envKey];
  if (!priceId) {
    throw new Error(`${envKey} is not configured`);
  }
  return priceId;
}
