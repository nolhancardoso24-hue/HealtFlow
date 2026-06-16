import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const practitionerId = await getPractitionerId(supabase);

  if (!user || !practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", practitionerId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    email: user.email ?? "",
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const practitionerId = await getPractitionerId(supabase);

  if (!user || !practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const nextEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (nextEmail && nextEmail !== (user.email ?? "").toLowerCase()) {
    const { error: authError } = await supabase.auth.updateUser({ email: nextEmail });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }
  }

  // `email` is stored on the auth user rather than the `profiles` row.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { email, ...profileUpdates } = body;

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...profileUpdates, updated_at: new Date().toISOString() })
    .eq("id", practitionerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ...data,
    email: nextEmail || user.email || "",
  });
}
