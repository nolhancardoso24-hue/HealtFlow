import { parseStripeError } from "@/lib/stripe/errors";

const PREFIX = "[stripe]";

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
