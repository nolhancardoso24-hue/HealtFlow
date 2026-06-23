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
  const message = err instanceof Error ? err.message : String(err);
  console.error(PREFIX, step, { ...details, error: message });
}
