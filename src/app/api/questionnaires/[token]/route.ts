import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: tokenRow } = await supabase
    .from("questionnaire_tokens")
    .select("*, appointment:appointments(*, patient:patients(*))")
    .eq("token", token)
    .single();

  if (!tokenRow) {
    return NextResponse.json({ valid: false });
  }

  if (new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ valid: false });
  }

  const { data: existing } = await supabase
    .from("questionnaires")
    .select("submitted_at")
    .eq("appointment_id", tokenRow.appointment_id)
    .single();

  return NextResponse.json({
    valid: true,
    patientName: tokenRow.appointment?.patient?.first_name ?? "",
    alreadySubmitted: !!existing?.submitted_at,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  const { data: tokenRow } = await supabase
    .from("questionnaire_tokens")
    .select("*")
    .eq("token", token)
    .single();

  if (!tokenRow || new Date(tokenRow.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const { data: appointment } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("id", tokenRow.appointment_id)
    .single();

  const { error } = await supabase.from("questionnaires").upsert({
    appointment_id: tokenRow.appointment_id,
    patient_id: appointment?.patient_id,
    relief_level: body.relief_level,
    side_effects: body.side_effects,
    current_pain: body.current_pain,
    exercises_done: body.exercises_done,
    comments: body.comments,
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase
    .from("questionnaire_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", tokenRow.id);

  return NextResponse.json({ success: true });
}
