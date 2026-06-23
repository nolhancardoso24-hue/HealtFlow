const PROFILE_UPDATABLE_KEYS = [
  "first_name",
  "last_name",
  "phone",
  "specialty",
  "cabinet_name",
  "hours_start",
  "hours_end",
  "days_closed",
  "session_duration_minutes",
  "language",
  "timezone",
  "email_reminders",
  "sms_reminders",
  "onboarding_completed",
] as const;

/** Champs profil modifiables par le praticien — exclut billing et identifiants système. */
export function pickProfileUpdates(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};

  for (const key of PROFILE_UPDATABLE_KEYS) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  return updates;
}
