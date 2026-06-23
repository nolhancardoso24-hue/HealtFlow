import { createClient } from "@/lib/supabase/server";

export async function getPractitionerId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
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

export async function assertPatientOwnedByPractitioner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patientId: string,
  practitionerId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .eq("practitioner_id", practitionerId)
    .maybeSingle();

  return !!data;
}
