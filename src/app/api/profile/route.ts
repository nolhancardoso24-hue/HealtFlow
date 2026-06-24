import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/api/require-subscription";
import { pickProfileUpdates } from "@/lib/api/profile-fields";

export async function GET() {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", access.practitionerId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    email: access.userEmail ?? "",
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;

  const body = await request.json();
  const nextEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (nextEmail && nextEmail !== (access.userEmail ?? "").toLowerCase()) {
    const { error: authError } = await supabase.auth.updateUser({ email: nextEmail });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  }

  const profileUpdates = pickProfileUpdates(body as Record<string, unknown>);

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...profileUpdates, updated_at: new Date().toISOString() })
    .eq("id", access.practitionerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    email: nextEmail || access.userEmail || "",
  });
}
