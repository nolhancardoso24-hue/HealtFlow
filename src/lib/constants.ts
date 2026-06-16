export const SPECIALTIES = [
  "Médecin",
  "Kiné",
  "Ostéopathe",
  "Masseuse",
  "Nutritionniste",
  "Coach",
  "Autre",
] as const;

export const SESSION_DURATIONS = [30, 45, 60] as const;

export const DAYS_OF_WEEK = [
  { value: 0, label: "Lundi" },
  { value: 1, label: "Mardi" },
  { value: 2, label: "Mercredi" },
  { value: 3, label: "Jeudi" },
  { value: 4, label: "Vendredi" },
  { value: 5, label: "Samedi" },
  { value: 6, label: "Dimanche" },
];

export const BRAND = {
  primary: "#0066CC",
  accent: "#10B981",
  name: "HealthFlow",
};
