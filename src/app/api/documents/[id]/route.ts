import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getPractitionerId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("user_id", user.id).single();
  return profile?.id ?? null;
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);

  if (!practitionerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: doc } = await supabase
    .from("documents").select("file_path").eq("id", id).single();

  if (doc?.file_path) {
    await supabase.storage.from("healthflow-documents").remove([doc.file_path]);
  }

  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
