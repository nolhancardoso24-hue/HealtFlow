const APPOINTMENT_UPDATABLE_KEYS = [
  "date_time",
  "duration_minutes",
  "reason",
  "notes",
  "status",
  "is_absent",
  "appointment_type",
  "price",
  "location",
  "meeting_url",
  "recurring",
  "confirmed_at",
  "cancellation_reason",
] as const;

/** Champs RDV modifiables — exclut patient_id et practitioner_id. */
export function pickAppointmentUpdates(body: Record<string, unknown>) {
  const updates: Record<string, unknown> = {};

  for (const key of APPOINTMENT_UPDATABLE_KEYS) {
    if (key in body) {
      updates[key] = body[key];
    }
  }

  return updates;
}
