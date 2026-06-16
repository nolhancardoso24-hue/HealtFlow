import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabase
    .from("profiles")
    .update({
      hours_start: body.hours_start,
      hours_end: body.hours_end,
      session_duration_minutes: body.session_duration_minutes,
      days_closed: body.days_closed,
      timezone: body.timezone,
      language: body.language,
      email_reminders: body.email_reminders,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
