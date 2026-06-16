import { differenceInDays, parseISO } from "date-fns";
import type { Patient, Questionnaire } from "@/types/database";

interface RiskInput {
  patient: Patient;
  lastAppointmentDate: string | null;
  absenceRate: number;
  unansweredQuestionnaires: number;
  exerciseCompliance: number;
  avgSatisfaction: number;
}

export function calculateRiskScore(input: RiskInput): { score: number; level: "low" | "medium" | "high" | "critical" } {
  let score = 0;

  if (input.lastAppointmentDate) {
    const daysSince = differenceInDays(new Date(), parseISO(input.lastAppointmentDate));
    if (daysSince > 90) score += 30;
    else if (daysSince > 45) score += 20;
    else if (daysSince > 30) score += 10;
  } else {
    score += 15;
  }

  if (input.exerciseCompliance < 50) score += 20;
  else if (input.exerciseCompliance < 75) score += 10;

  if (input.unansweredQuestionnaires > 2) score += 15;
  else if (input.unansweredQuestionnaires > 0) score += 8;

  if (input.absenceRate > 20) score += 20;
  else if (input.absenceRate > 10) score += 10;

  if (input.avgSatisfaction > 0 && input.avgSatisfaction < 6) score += 10;

  const level =
    score >= 81 ? "critical" : score >= 61 ? "high" : score >= 41 ? "medium" : "low";

  return { score: Math.min(score, 100), level };
}

export function computeExerciseCompliance(questionnaires: Questionnaire[]): number {
  const withExercise = questionnaires.filter((q) => q.exercises_done);
  if (withExercise.length === 0) return 100;

  const yesCount = withExercise.filter((q) => q.exercises_done === "yes").length;
  const partialCount = withExercise.filter((q) => q.exercises_done === "partial").length;
  return Math.round(((yesCount + partialCount * 0.5) / withExercise.length) * 100);
}
