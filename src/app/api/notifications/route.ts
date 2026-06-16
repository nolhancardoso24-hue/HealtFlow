import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getPractitionerId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("user_id", user.id).single();
  return profile?.id ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);
  if (!practitionerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);
  if (!practitionerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase
    .from("notifications")
    .insert({ ...body, practitioner_id: practitionerId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
