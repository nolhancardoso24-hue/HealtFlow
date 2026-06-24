import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/api/require-subscription";
import { pickAppointmentUpdates } from "@/lib/api/appointment-fields";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;
  const { practitionerId } = access;

  const body = await request.json();
  const updates = pickAppointmentUpdates(body as Record<string, unknown>);

  const { data, error } = await supabase
    .from("appointments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("practitioner_id", practitionerId)
    .select("*, patient:patients(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (updates.status === "completed") {
    await supabase
      .from("patients")
      .update({
        last_appointment_date: data.date_time.split("T")[0],
      })
      .eq("id", data.patient_id);
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
  const { practitionerId } = access;

  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("practitioner_id", practitionerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
