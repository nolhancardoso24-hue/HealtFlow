import Anthropic from "@anthropic-ai/sdk";
import { SESSION_SUMMARY_PROMPT, SUGGESTED_QUESTIONS_PROMPT, RISK_ANALYSIS_PROMPT } from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function summarizeSession(params: {
  patientName: string;
  patientAge: number;
  chiefComplaint: string;
  historySummary: string;
  notes: string;
  date: string;
}): Promise<string> {
  const prompt = SESSION_SUMMARY_PROMPT.replace("{patient.name}", params.patientName)
    .replace("{patient.age}", String(params.patientAge))
    .replace("{patient.chief_complaint}", params.chiefComplaint)
    .replace("{patient.history_summary}", params.historySummary)
    .replace("{notes}", params.notes)
    .replace("[DATE]", params.date);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function suggestQuestions(params: {
  patientName: string;
  chiefComplaint: string;
  lastSessionSummary: string;
  prescribedExercises: string;
  patientFeedback: string;
}): Promise<string> {
  const prompt = SUGGESTED_QUESTIONS_PROMPT.replace("{patient.name}", params.patientName)
    .replace("{patient.chief_complaint}", params.chiefComplaint)
    .replace("{last_session_summary}", params.lastSessionSummary)
    .replace("{prescribed_exercises}", params.prescribedExercises)
    .replace("{patient_feedback}", params.patientFeedback);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function analyzeRiskPatients(patientsData: string): Promise<string> {
  const prompt = RISK_ANALYSIS_PROMPT.replace("{patients_data}", patientsData);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content[0];
  return block.type === "text" ? block.text : "";
}

export async function streamChat(
  systemPrompt: string,
  userMessage: string,
  onChunk: (text: string) => void
): Promise<string> {
  let fullText = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      onChunk(event.delta.text);
    }
  }

  return fullText;
}
