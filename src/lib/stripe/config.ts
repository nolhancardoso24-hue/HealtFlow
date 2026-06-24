/** 6 premiers caractères de la clé — safe pour les logs debug. */
export function previewStripeSecretKey(): { defined: boolean; prefix: string | null } {
  const raw = process.env.STRIPE_SECRET_KEY?.trim();
  return {
    defined: Boolean(raw),
    prefix: raw ? raw.slice(0, 6) : null,
  };
}

/** Tous les Price IDs configurés (valeurs complètes, safe à logger). */
export function getStripePriceIdsForLog(): Record<string, string | null> {
  return {
    STRIPE_PRICE_ID_STARTER: process.env.STRIPE_PRICE_ID_STARTER?.trim() ?? null,
    STRIPE_PRICE_ID_STARTER_ANNUAL: process.env.STRIPE_PRICE_ID_STARTER_ANNUAL?.trim() ?? null,
    STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO?.trim() ?? null,
    STRIPE_PRICE_ID_PRO_ANNUAL: process.env.STRIPE_PRICE_ID_PRO_ANNUAL?.trim() ?? null,
  };
}

export function resolvePriceEnvKey(
  plan: "pro" | "starter",
  interval: "monthly" | "annual"
): string {
  if (plan === "pro") {
    return interval === "annual" ? "STRIPE_PRICE_ID_PRO_ANNUAL" : "STRIPE_PRICE_ID_PRO";
  }
  return interval === "annual" ? "STRIPE_PRICE_ID_STARTER_ANNUAL" : "STRIPE_PRICE_ID_STARTER";
}

/** Price ID sélectionné pour un plan/interval donné (sans validation). */
export function getSelectedPriceIdDebug(
  plan: "pro" | "starter",
  interval: "monthly" | "annual"
): { env_key: string; price_id: string | null } {
  const envKey = resolvePriceEnvKey(plan, interval);
  return {
    env_key: envKey,
    price_id: process.env[envKey]?.trim() ?? null,
  };
}

/** Masque une clé Stripe pour les logs (sk_test_...abcd). */
export function maskStripeKey(key: string): string {
  if (key.length < 12) return "(too_short)";
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

function isPlaceholderKey(key: string): boolean {
  return (
    key.includes("...") ||
    key.endsWith("_") ||
    key === "sk_test" ||
    key === "sk_live" ||
    key.startsWith("your-")
  );
}

/** Valide STRIPE_SECRET_KEY — lève une erreur explicite si absent ou invalide. */
export function validateStripeSecretKey(): string {
  const raw = process.env.STRIPE_SECRET_KEY;

  if (!raw?.trim()) {
    throw new Error(
      "STRIPE_SECRET_KEY manquant : ajoutez votre clé secrète Stripe (sk_test_... ou sk_live_...) dans les variables d'environnement (Vercel → Settings → Environment Variables), puis redéployez."
    );
  }

  const key = raw.trim();

  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    throw new Error(
      "STRIPE_SECRET_KEY invalide : la clé doit commencer par sk_test_ (mode test) ou sk_live_ (production)."
    );
  }

  if (isPlaceholderKey(key)) {
    throw new Error(
      "STRIPE_SECRET_KEY invalide : remplacez le placeholder par votre vraie clé depuis Stripe Dashboard → Developers → API keys."
    );
  }

  return key;
}

/** Statut de config pour logs serveur (sans exposer la clé complète). */
export function getStripeConfigStatus(): Record<string, string | boolean> {
  const raw = process.env.STRIPE_SECRET_KEY;
  const key = raw?.trim() ?? "";

  return {
    secret_key_present: Boolean(key),
    secret_key_mode: key.startsWith("sk_live_")
      ? "live"
      : key.startsWith("sk_test_")
        ? "test"
        : "invalid",
    secret_key_masked: key ? maskStripeKey(key) : null,
    price_starter: Boolean(process.env.STRIPE_PRICE_ID_STARTER),
    price_starter_annual: Boolean(process.env.STRIPE_PRICE_ID_STARTER_ANNUAL),
    price_pro: Boolean(process.env.STRIPE_PRICE_ID_PRO),
    price_pro_annual: Boolean(process.env.STRIPE_PRICE_ID_PRO_ANNUAL),
    webhook_secret_present: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    app_url: process.env.NEXT_PUBLIC_APP_URL ?? "(default localhost:3000)",
  } as Record<string, string | boolean>;
}
