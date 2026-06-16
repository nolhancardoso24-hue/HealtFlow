import { Resend } from "resend";
import {
  appointmentReminderHtml,
  questionnaireInviteHtml,
  questionnaireFollowUpHtml,
  exerciseReminderHtml,
} from "./templates";

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
  confirmLink?: string;
}) {
  return {
    subject: `Rappel: rendez-vous demain chez ${params.practitionerName}`,
    html: appointmentReminderHtml({
      patientName: params.patientName,
      practitionerName: params.practitionerName,
      dateFormatted: params.dateTime,
      confirmLink: params.confirmLink,
    }),
  };
}

export function questionnaireInviteEmail(params: {
  patientName: string;
  practitionerName: string;
  link: string;
}) {
  return {
    subject: `${params.patientName}, comment vous sentez-vous après votre séance?`,
    html: questionnaireInviteHtml(params),
  };
}

export function questionnaireFollowUpEmail(params: {
  patientName: string;
  link: string;
}) {
  return {
    subject: "Votre avis nous intéresse — 2 minutes suffisent",
    html: questionnaireFollowUpHtml(params),
  };
}

export function exerciseReminderEmail(params: {
  patientEmail: string;
  patientName: string;
  exercises: string[];
  nextAppointmentDate?: string;
}) {
  return {
    subject: "N'oubliez pas vos exercices!",
    html: exerciseReminderHtml({
      patientName: params.patientName,
      exercises: params.exercises,
      nextAppointmentDate: params.nextAppointmentDate,
    }),
  };
}
