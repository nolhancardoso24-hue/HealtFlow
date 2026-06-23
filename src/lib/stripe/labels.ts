import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";

export function planLabel(plan: SubscriptionPlan | undefined | null): string {
  switch (plan) {
    case "pro":
      return "Pro";
    case "starter":
      return "Starter";
    case "free":
    default:
      return "Free";
  }
}

export function statusLabel(status: SubscriptionStatus | undefined | null): string {
  switch (status) {
    case "active":
      return "Actif";
    case "trialing":
      return "Essai gratuit";
    case "expired":
      return "Expiré";
    case "cancelled":
      return "Annulé";
    default:
      return "Inconnu";
  }
}
