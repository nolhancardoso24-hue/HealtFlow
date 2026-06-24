import Stripe from "stripe";

export type StripeErrorDetails = {
  message: string;
  type?: string;
  code?: string;
  statusCode?: number;
  requestId?: string;
  isConnectionError: boolean;
};

/** Extrait les détails d'une erreur Stripe pour logs et réponses API. */
export function parseStripeError(err: unknown): StripeErrorDetails {
  if (err instanceof Stripe.errors.StripeConnectionError) {
    return {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      requestId: err.requestId,
      isConnectionError: true,
    };
  }

  if (err instanceof Stripe.errors.StripeError) {
    return {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      requestId: err.requestId,
      isConnectionError: false,
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      isConnectionError: /connection to Stripe/i.test(err.message),
    };
  }

  return {
    message: String(err),
    isConnectionError: false,
  };
}

/** Objet complet pour logs debug (erreur Stripe exacte). */
export function stripeErrorToLogObject(err: unknown): Record<string, unknown> {
  if (err instanceof Stripe.errors.StripeError) {
    return {
      type: err.type,
      code: err.code,
      message: err.message,
      requestId: err.requestId,
      statusCode: err.statusCode,
      raw: err.raw,
      stack: err.stack,
    };
  }

  if (err instanceof Error) {
    return {
      message: err.message,
      stack: err.stack,
    };
  }

  return { message: String(err) };
}

/** Message utilisateur sans détails sensibles. */
export function toPublicStripeErrorMessage(err: unknown): string {
  const parsed = parseStripeError(err);

  if (parsed.message.includes("STRIPE_SECRET_KEY")) {
    return parsed.message;
  }

  if (parsed.isConnectionError) {
    return "Impossible de contacter Stripe. Vérifiez STRIPE_SECRET_KEY et les variables d'environnement sur Vercel, puis redéployez.";
  }

  if (parsed.code === "resource_missing") {
    return "Price ID Stripe introuvable. Vérifiez que STRIPE_PRICE_ID_* correspond au même mode (test/live) que STRIPE_SECRET_KEY.";
  }

  return parsed.message;
}
