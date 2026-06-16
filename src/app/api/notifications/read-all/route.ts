import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getPractitionerId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("user_id", user.id).single();
  return profile?.id ?? null;
}

export async function PATCH() {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);
  if (!practitionerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("practitioner_id", practitionerId)
    .eq("is_read", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
