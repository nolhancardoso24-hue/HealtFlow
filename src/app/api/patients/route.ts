import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updatePatientTags } from "@/lib/segmentation";

async function getPractitionerId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return profile?.id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);

  if (!practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("last_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);

  if (!practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tags, age_group } = updatePatientTags({
    date_of_birth: body.date_of_birth,
    chief_complaint: body.chief_complaint,
    medical_history: body.medical_history,
  });

  const { data, error } = await supabase
    .from("patients")
    .insert({
      practitioner_id: practitionerId,
      first_name: body.first_name,
      last_name: body.last_name,
      date_of_birth: body.date_of_birth,
      phone: body.phone || null,
      email: body.email || null,
      chief_complaint: body.chief_complaint,
      medical_history: body.medical_history || null,
      tags,
      age_group,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
