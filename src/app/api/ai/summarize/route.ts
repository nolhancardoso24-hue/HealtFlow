import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/api/require-subscription";
import { summarizeSession } from "@/lib/ai/claude";
import { calculateAge } from "@/lib/segmentation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;

  const { appointment_id } = await request.json();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, patient:patients(*)")
    .eq("id", appointment_id)
    .single();

  if (!appointment?.patient || !appointment.notes) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const summary = await summarizeSession({
    patientName: `${appointment.patient.first_name} ${appointment.patient.last_name}`,
    patientAge: calculateAge(appointment.patient.date_of_birth),
    chiefComplaint: appointment.patient.chief_complaint,
    historySummary: appointment.patient.medical_history ?? "",
    notes: appointment.notes,
    date: appointment.date_time.split("T")[0],
  });

  return NextResponse.json({ summary });
}
