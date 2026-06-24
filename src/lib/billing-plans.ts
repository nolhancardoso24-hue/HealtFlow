export type BillingPlanId = "starter" | "pro";
export type BillingInterval = "monthly" | "annual";

export type PlanPricing = {
  monthlyPrice: number;
  annualTotal: number;
  annualDiscountPercent: number;
  annualSavings: number;
};

export const PLAN_PRICING: Record<BillingPlanId, PlanPricing> = {
  starter: {
    monthlyPrice: 29,
    annualTotal: 330,
    annualDiscountPercent: 5,
    annualSavings: 18,
  },
  pro: {
    monthlyPrice: 79,
    annualTotal: 853,
    annualDiscountPercent: 10,
    annualSavings: 95,
  },
};

export const BILLING_PLANS = [
  {
    id: "starter" as const,
    name: "Starter",
    description: "Idéal pour un praticien solo",
    ...PLAN_PRICING.starter,
    features: [
      "Jusqu'à 100 patients",
      "Calendrier & rendez-vous",
      "Questionnaires patients",
      "Rappels email automatiques",
      "Export CSV",
    ],
    comparisonFeatures: [
      { text: "Jusqu'à 100 patients", ok: true },
      { text: "Calendrier & rendez-vous", ok: true },
      { text: "Questionnaires patients", ok: true },
      { text: "Rappels email automatiques", ok: true },
      { text: "Export CSV", ok: true },
      { text: "Assistant IA", ok: false },
      { text: "Analytics avancés", ok: false },
      { text: "Documents & stockage", ok: false },
      { text: "Support prioritaire", ok: false },
    ],
  },
  {
    id: "pro" as const,
    name: "Pro",
    description: "Cabinet complet, sans limites",
    ...PLAN_PRICING.pro,
    features: [
      "Patients illimités",
      "Assistant IA (Claude)",
      "Analytics avancés",
      "Documents & stockage 10 Go",
      "Support prioritaire",
      "Tout le plan Starter inclus",
    ],
    comparisonFeatures: [
      { text: "Patients illimités", ok: true },
      { text: "Calendrier & rendez-vous", ok: true },
      { text: "Questionnaires patients", ok: true },
      { text: "Rappels email automatiques", ok: true },
      { text: "Export CSV", ok: true },
      { text: "Assistant IA (Claude)", ok: true },
      { text: "Analytics avancés", ok: true },
      { text: "Documents & stockage 10 Go", ok: true },
      { text: "Support prioritaire", ok: true },
    ],
  },
] as const;

export type BillingPlan = (typeof BILLING_PLANS)[number];

export function getPlanPriceDisplay(plan: BillingPlan, interval: BillingInterval) {
  if (interval === "monthly") {
    return {
      amount: plan.monthlyPrice,
      periodLabel: "/mois",
      discountPercent: null as number | null,
      annualSavings: null as number | null,
      monthlyReference: plan.monthlyPrice,
    };
  }
  return {
    amount: plan.annualTotal,
    periodLabel: "/an",
    discountPercent: plan.annualDiscountPercent,
    annualSavings: plan.annualSavings,
    monthlyReference: plan.monthlyPrice,
  };
}
