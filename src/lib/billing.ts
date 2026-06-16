import type { Profile, SubscriptionStatus } from "@/types/database";

export interface BillingState {
  status: SubscriptionStatus;
  trialDaysLeft: number;
  isExpired: boolean;
  isActive: boolean;
  isTrial: boolean;
}

export function getBillingState(profile: Partial<Profile>): BillingState {
  const status = (profile.subscription_status ?? "trialing") as SubscriptionStatus;

  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const now = new Date();

  const trialDaysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isExpired =
    (status === "trialing" && trialDaysLeft === 0) || status === "expired" || status === "cancelled";

  const isActive = status === "active";
  const isTrial = status === "trialing" && !isExpired;

  return { status, trialDaysLeft, isExpired, isActive, isTrial };
}
