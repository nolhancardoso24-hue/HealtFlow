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

export async function POST(request: Request) {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);

  if (!practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { csv } = await request.json();
  const lines = csv.split("\n").filter((l: string) => l.trim());
  const imported = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p: string) => p.trim());
    if (parts.length < 3) continue;

    const [lastName, firstName, dob, complaint] = parts;
    const { tags, age_group } = updatePatientTags({
      date_of_birth: dob,
      chief_complaint: complaint ?? "Non spécifié",
      medical_history: null,
    });

    const { data } = await supabase
      .from("patients")
      .insert({
        practitioner_id: practitionerId,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        chief_complaint: complaint ?? "Non spécifié",
        tags,
        age_group,
      })
      .select()
      .single();

    if (data) imported.push(data);
  }

  return NextResponse.json({ imported: imported.length });
}
