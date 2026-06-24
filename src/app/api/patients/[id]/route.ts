import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/api/require-subscription";
import { updatePatientTags } from "@/lib/segmentation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .eq("practitioner_id", access.practitionerId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  const { data: appointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("patient_id", id)
    .order("date_time", { ascending: false });

  return NextResponse.json({ patient, appointments });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;

  const body = await request.json();

  const { tags, age_group } = updatePatientTags({
    date_of_birth: body.date_of_birth,
    chief_complaint: body.chief_complaint,
    medical_history: body.medical_history,
  });

  const { data, error } = await supabase
    .from("patients")
    .update({
      ...body,
      tags,
      age_group,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("practitioner_id", access.practitionerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;

  const { error } = await supabase
    .from("patients")
    .delete()
    .eq("id", id)
    .eq("practitioner_id", access.practitionerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
