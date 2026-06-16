import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "HealthFlow <onboarding@resend.dev>";

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!resend) {
    console.log("[Email mock]", params.subject, "→", params.to);
    return { success: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export function appointmentReminderEmail(params: {
  patientName: string;
  practitionerName: string;
  dateTime: string;
}): { subject: string; html: string } {
  return {
    subject: `Rappel: rendez-vous demain chez ${params.practitionerName}`,
    html: `
      <p>Bonjour ${params.patientName},</p>
      <p>Petit rappel: vous avez rendez-vous demain à ${params.dateTime}.</p>
      <p>À demain!</p>
      <p><em>HealthFlow</em></p>
    `,
  };
}

export function questionnaireInviteEmail(params: {
  patientName: string;
  practitionerName: string;
  link: string;
}): { subject: string; html: string } {
  return {
    subject: `${params.patientName}, comment vous sentez-vous après votre séance?`,
    html: `
      <p>Bonjour ${params.patientName},</p>
      <p>Merci pour votre visite chez ${params.practitionerName}.</p>
      <p>Prenez 2 minutes pour nous dire comment vous allez:</p>
      <p><a href="${params.link}">Remplir le questionnaire</a></p>
      <p><em>HealthFlow</em></p>
    `,
  };
}

export function questionnaireFollowUpEmail(params: {
  patientName: string;
  link: string;
}): { subject: string; html: string } {
  return {
    subject: "Votre avis nous intéresse",
    html: `
      <p>Bonjour ${params.patientName},</p>
      <p>Nous aimerions connaître votre ressenti après votre dernière séance.</p>
      <p>Ça vous prend 2 min: <a href="${params.link}">Répondre au questionnaire</a></p>
      <p><em>HealthFlow</em></p>
    `,
  };
}
