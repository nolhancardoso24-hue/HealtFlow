import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";
import { sendEmail, questionnaireInviteEmail } from "@/lib/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { appointment_id } = await request.json();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("*, patient:patients(*), practitioner:profiles(*)")
    .eq("id", appointment_id)
    .single();

  if (!appointment) {
    return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  }

  const token = randomBytes(32).toString("hex");

  await supabase.from("questionnaire_tokens").upsert({
    appointment_id,
    token,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/q/${token}`;

  if (appointment.patient?.email) {
    const email = questionnaireInviteEmail({
      patientName: appointment.patient.first_name,
      practitionerName: `${appointment.practitioner?.first_name} ${appointment.practitioner?.last_name}`,
      link,
    });
    await sendEmail({
      to: appointment.patient.email,
      subject: email.subject,
      html: email.html,
    });
  }

  return NextResponse.json({ link, token });
}
