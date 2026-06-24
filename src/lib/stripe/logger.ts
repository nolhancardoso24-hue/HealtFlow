import Stripe from "stripe";
import { parseStripeError } from "@/lib/stripe/errors";

const PREFIX = "[stripe]";

/** Log l'erreur Stripe brute — visible dans les logs Vercel. */
export function logStripeRawError(err: unknown): void {
  if (err instanceof Stripe.errors.StripeError) {
    console.error("[stripe raw error]", {
      type: err.type,
      code: err.code,
      message: err.message,
      requestId: err.requestId,
      statusCode: err.statusCode,
      raw: err.raw,
      stack: err.stack,
    });
    return;
  }

  if (err instanceof Error) {
    console.error("[stripe raw error]", {
      type: undefined,
      code: undefined,
      message: err.message,
      requestId: undefined,
      statusCode: undefined,
      raw: undefined,
      stack: err.stack,
    });
    return;
  }

  console.error("[stripe raw error]", {
    type: undefined,
    code: undefined,
    message: String(err),
    requestId: undefined,
    statusCode: undefined,
    raw: undefined,
    stack: undefined,
  });
}

export function stripeLog(
  step: string,
  details?: Record<string, string | number | boolean | null | undefined>
) {
  if (details && Object.keys(details).length > 0) {
    console.log(PREFIX, step, details);
    return;
  }
  console.log(PREFIX, step);
}

export function stripeLogError(
  step: string,
  err: unknown,
  details?: Record<string, string | number | boolean | null | undefined>
) {
  const parsed = parseStripeError(err);
  console.error(PREFIX, step, {
    ...details,
    error: parsed.message,
    stripe_type: parsed.type,
    stripe_code: parsed.code,
    stripe_status: parsed.statusCode,
    stripe_request_id: parsed.requestId,
    is_connection_error: parsed.isConnectionError,
  });
}
