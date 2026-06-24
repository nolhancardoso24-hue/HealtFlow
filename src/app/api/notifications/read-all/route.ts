import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/api/require-subscription";

export async function PATCH() {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;
  const { practitionerId } = access;

  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("practitioner_id", practitionerId)
    .eq("is_read", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
