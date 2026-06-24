import Stripe from "stripe";
import { getStripeConfigStatus, validateStripeSecretKey } from "@/lib/stripe/config";
import { stripeLog } from "@/lib/stripe/logger";

let stripe: Stripe | null = null;
let initializedKey: string | null = null;

/**
 * Client Stripe singleton — server-side uniquement.
 * Valide STRIPE_SECRET_KEY à chaque première utilisation (ou si la clé change).
 */
export function getStripe(): Stripe {
  const key = validateStripeSecretKey();

  if (!stripe || initializedKey !== key) {
    stripeLog("initializing Stripe client", getStripeConfigStatus());

    stripe = new Stripe(key, {
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 20_000,
      appInfo: {
        name: "HealthFlow",
        version: "0.1.0",
      },
    });

    initializedKey = key;
    stripeLog("Stripe client ready", {
      mode: key.startsWith("sk_live_") ? "live" : "test",
    });
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

  const priceId = process.env[envKey]?.trim();
  if (!priceId) {
    throw new Error(
      `${envKey} manquant : ajoutez le Price ID Stripe dans les variables d'environnement (Dashboard Stripe → Products → Pricing).`
    );
  }

  if (!priceId.startsWith("price_")) {
    throw new Error(
      `${envKey} invalide ("${priceId}") : un Price ID Stripe commence par price_.`
    );
  }

  return priceId;
}
