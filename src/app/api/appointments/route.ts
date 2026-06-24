import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  assertPatientOwnedByPractitioner,
} from "@/lib/api/practitioner";
import { requireActiveSubscription } from "@/lib/api/require-subscription";

export async function GET(request: Request) {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;
  const { practitionerId } = access;

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  let query = supabase
    .from("appointments")
    .select("*, patient:patients(*)")
    .eq("practitioner_id", practitionerId)
    .order("date_time");

  if (dateFrom) query = query.gte("date_time", `${dateFrom}T00:00:00`);
  if (dateTo) query = query.lte("date_time", `${dateTo}T23:59:59`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;
  const { practitionerId } = access;

  const body = await request.json();

  if (!body.patient_id || !body.date_time) {
    return NextResponse.json({ error: "patient_id and date_time required" }, { status: 400 });
  }

  const ownsPatient = await assertPatientOwnedByPractitioner(
    supabase,
    body.patient_id,
    practitionerId
  );
  if (!ownsPatient) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: body.patient_id,
      practitioner_id: practitionerId,
      date_time: body.date_time,
      duration_minutes: body.duration_minutes ?? 45,
      reason: body.reason,
      notes: body.notes,
      status: "scheduled",
    })
    .select("*, patient:patients(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("patients")
    .update({ last_appointment_date: body.date_time.split("T")[0] })
    .eq("id", body.patient_id);

  return NextResponse.json(data);
}
