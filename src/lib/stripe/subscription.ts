import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";
import { getStripe } from "@/lib/stripe/client";
import { stripeLog, stripeLogError } from "@/lib/stripe/logger";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "cancelled";
    case "past_due":
    case "unpaid":
    case "incomplete_expired":
      return "expired";
    default:
      return "expired";
  }
}

function resolvePlan(metadata: Stripe.Metadata | null | undefined): SubscriptionPlan {
  const plan = metadata?.plan;
  if (plan === "pro" || plan === "starter") return plan;
  return "pro";
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  const rootEnd = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (rootEnd) return rootEnd;

  const itemEnd = (
    subscription.items.data[0] as { current_period_end?: number } | undefined
  )?.current_period_end;
  return itemEnd ?? null;
}

export async function syncProfileFromSubscription(
  subscription: Stripe.Subscription,
  fallbackUserId?: string
) {
  const userId = subscription.metadata?.user_id ?? fallbackUserId;
  if (!userId) {
    throw new Error("Missing user_id in subscription metadata");
  }

  const plan = resolvePlan(subscription.metadata);
  const status = mapStripeStatus(subscription.status);
  const periodEnd = getSubscriptionPeriodEnd(subscription);

  stripeLog("sync subscription → Supabase", {
    user_id: userId,
    plan,
    status,
    subscription_id: subscription.id,
    period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  });

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: status,
      subscription_plan: plan,
      subscription_ends_at: periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    stripeLogError("sync subscription failed", error, { user_id: userId });
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  stripeLog("profile updated", { user_id: userId, plan, status });
}

export async function syncProfileFromCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id ?? session.client_reference_id ?? undefined;
  if (!userId) {
    throw new Error("Missing user_id in checkout session");
  }

  const plan = resolvePlan(session.metadata);

  stripeLog("checkout.session.completed", {
    user_id: userId,
    plan,
    session_id: session.id,
    subscription: typeof session.subscription === "string" ? session.subscription : null,
  });

  if (session.subscription && typeof session.subscription === "string") {
    const subscription = await getStripe().subscriptions.retrieve(session.subscription);
    await syncProfileFromSubscription(subscription, userId);
    return;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_plan: plan,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    stripeLogError("checkout sync failed", error, { user_id: userId, plan });
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  stripeLog("profile updated (checkout fallback)", { user_id: userId, plan, status: "active" });
}
