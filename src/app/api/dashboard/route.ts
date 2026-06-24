import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { requireActiveSubscription } from "@/lib/api/require-subscription";

export async function GET() {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;
  const { practitionerId } = access;

  const today = new Date();
  const todayStart = startOfDay(today).toISOString();
  const todayEnd = endOfDay(today).toISOString();

  const { data: todayAppointments } = await supabase
    .from("appointments")
    .select("*, patient:patients(*)")
    .eq("practitioner_id", practitionerId)
    .gte("date_time", todayStart)
    .lte("date_time", todayEnd)
    .order("date_time");

  const { count: activePatients } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("practitioner_id", practitionerId)
    .eq("status", "active");

  const { data: completedAppts } = await supabase
    .from("appointments")
    .select("id")
    .eq("practitioner_id", practitionerId)
    .eq("status", "completed");

  const { data: questionnaires } = await supabase
    .from("questionnaires")
    .select("id, submitted_at, appointment_id")
    .not("submitted_at", "is", null);

  const completedIds = new Set(completedAppts?.map((a) => a.id) ?? []);
  const respondedForPractitioner =
    questionnaires?.filter((q) => completedIds.has(q.appointment_id)).length ?? 0;
  const questionnaireCompletionRate =
    completedAppts && completedAppts.length > 0
      ? Math.round((respondedForPractitioner / completedAppts.length) * 100)
      : 0;

  const appointmentsByDay = [];
  for (let i = 6; i >= 0; i--) {
    const day = subDays(today, i);
    const dayStart = startOfDay(day).toISOString();
    const dayEnd = endOfDay(day).toISOString();

    const { count } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("practitioner_id", practitionerId)
      .gte("date_time", dayStart)
      .lte("date_time", dayEnd);

    appointmentsByDay.push({
      date: format(day, "dd/MM"),
      count: count ?? 0,
    });
  }

  const { data: patients } = await supabase
    .from("patients")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .eq("status", "active");

  const alerts: { type: "risk" | "trend" | "action"; message: string }[] = [];

  const atRisk = patients?.filter((p) => p.risk_score >= 60) ?? [];
  if (atRisk.length > 0) {
    const p = atRisk[0];
    alerts.push({
      type: "risk",
      message: `RISQUE: ${p.first_name} ${p.last_name} — score ${p.risk_score}/100`,
    });
  }

  const cervicalCount =
    patients?.filter((p) =>
      p.chief_complaint?.toLowerCase().includes("cervical")
    ).length ?? 0;
  if (cervicalCount > 0 && patients && patients.length > 0) {
    const pct = Math.round((cervicalCount / patients.length) * 100);
    if (pct >= 20) {
      alerts.push({
        type: "trend",
        message: `TENDANCE: Douleurs cervicales représentent ${pct}% des patients`,
      });
    }
  }

  const lowExercise = patients?.filter((p) => p.risk_score >= 40).length ?? 0;
  if (lowExercise >= 3) {
    alerts.push({
      type: "action",
      message: `ACTION: ${lowExercise} patients pourraient nécessiter un suivi exercices`,
    });
  }

  return NextResponse.json({
    appointmentsToday: todayAppointments?.length ?? 0,
    activePatients: activePatients ?? 0,
    questionnaireCompletionRate,
    weeklyProgress: Math.min(questionnaireCompletionRate, 100),
    todayAppointments: todayAppointments ?? [],
    alerts: alerts.slice(0, 3),
    appointmentsByDay,
  });
}
