import { createClient } from "@/lib/supabase/server";
import { streamChat } from "@/lib/ai/claude";
import { AI_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { summarizeSession, suggestQuestions, analyzeRiskPatients } from "@/lib/ai/claude";
import { calculateAge } from "@/lib/segmentation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { message } = await request.json();
  const lower = message.toLowerCase();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, first_name, last_name")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return new Response("Profile not found", { status: 404 });
  }

  const contextMessage = message;

  if (lower.includes("patients à risque") || lower.includes("patients a risque")) {
    const { data: patients } = await supabase
      .from("patients")
      .select("*")
      .eq("practitioner_id", profile.id)
      .gte("risk_score", 40)
      .order("risk_score", { ascending: false });

    const patientsData = (patients ?? [])
      .map(
        (p) =>
          `- ${p.first_name} ${p.last_name}: score ${p.risk_score}, motif: ${p.chief_complaint}, dernier RDV: ${p.last_appointment_date ?? "jamais"}`
      )
      .join("\n");

    const result = await analyzeRiskPatients(patientsData || "Aucun patient à risque détecté.");
    return Response.json({ content: result });
  }

  const patientMatch = message.match(/(?:avec|pour)\s+(\w+)/i);
  if (patientMatch && (lower.includes("résume") || lower.includes("resume") || lower.includes("questions"))) {
    const searchName = patientMatch[1];
    const { data: patients } = await supabase
      .from("patients")
      .select("*")
      .eq("practitioner_id", profile.id)
      .or(`first_name.ilike.%${searchName}%,last_name.ilike.%${searchName}%`);

    const patient = patients?.[0];
    if (patient) {
      const { data: lastApt } = await supabase
        .from("appointments")
        .select("*")
        .eq("patient_id", patient.id)
        .eq("status", "completed")
        .order("date_time", { ascending: false })
        .limit(1)
        .single();

      if (lower.includes("questions")) {
        const result = await suggestQuestions({
          patientName: `${patient.first_name} ${patient.last_name}`,
          chiefComplaint: patient.chief_complaint,
          lastSessionSummary: lastApt?.notes ?? "Pas de notes",
          prescribedExercises: "Non spécifié",
          patientFeedback: "Non disponible",
        });
        return Response.json({ content: result });
      }

      const result = await summarizeSession({
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientAge: calculateAge(patient.date_of_birth),
        chiefComplaint: patient.chief_complaint,
        historySummary: patient.medical_history ?? "Non renseigné",
        notes: lastApt?.notes ?? "Pas de notes disponibles",
        date: lastApt?.date_time?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      });
      return Response.json({ content: result });
    }
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      await streamChat(AI_SYSTEM_PROMPT, contextMessage, (chunk) => {
        controller.enqueue(encoder.encode(chunk));
      });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
