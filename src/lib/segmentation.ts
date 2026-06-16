import { differenceInYears, parseISO } from "date-fns";
import type { Patient } from "@/types/database";

export function calculateAge(dateOfBirth: string): number {
  return differenceInYears(new Date(), parseISO(dateOfBirth));
}

export function updatePatientTags(patient: Pick<Patient, "date_of_birth" | "chief_complaint" | "medical_history">): {
  tags: string[];
  age_group: string;
} {
  const age = calculateAge(patient.date_of_birth);
  const tags: string[] = [];
  let age_group = "adulte";

  if (age < 30) {
    tags.push("jeune");
    age_group = "jeune";
  } else if (age < 50) {
    tags.push("adulte");
    age_group = "adulte";
  } else {
    tags.push("senior");
    age_group = "senior";
  }

  const text = `${patient.chief_complaint} ${patient.medical_history ?? ""}`.toLowerCase();

  if (text.includes("sport") || text.includes("course") || text.includes("football")) {
    tags.push("sportif");
  }
  if (text.includes("bureau") || text.includes("télétravail") || text.includes("teletravail")) {
    tags.push("télétravail");
  }
  if (text.includes("lombaire")) tags.push("lombaire");
  if (text.includes("cervical")) tags.push("cervicale");
  if (text.includes("post-op") || text.includes("opération") || text.includes("operation")) {
    tags.push("post-opération");
  }
  if (text.includes("enceinte") || text.includes("grossesse")) {
    tags.push("enceinte");
  }
  if (text.includes("chronique")) tags.push("chronique");
  if (text.includes("aigu")) tags.push("aiguë");

  return { tags: Array.from(new Set(tags)), age_group };
}

export function getSegmentLabel(tags: string[]): string {
  if (tags.includes("sportif")) return "Sportifs";
  if (tags.includes("télétravail")) return "Télétravail";
  if (tags.includes("senior")) return "Seniors";
  if (tags.includes("post-opération")) return "Post-opération";
  if (tags.includes("enceinte")) return "Femmes enceintes";
  return "Général";
}
