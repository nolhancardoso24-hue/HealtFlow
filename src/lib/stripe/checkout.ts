import { getStripe, getStripePriceId } from "@/lib/stripe/client";

export async function createSubscriptionCheckoutSession(params: {
  userId: string;
  userEmail: string | undefined;
  profileId: string;
  plan: "pro" | "starter";
  interval: "monthly" | "annual";
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const priceId = getStripePriceId(params.plan, params.interval);

  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.userEmail,
    client_reference_id: params.userId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?billing=success`,
    cancel_url: `${appUrl}/settings?billing=cancelled`,
    metadata: {
      user_id: params.userId,
      profile_id: params.profileId,
      plan: params.plan,
    },
    subscription_data: {
      metadata: {
        user_id: params.userId,
        profile_id: params.profileId,
        plan: params.plan,
      },
    },
  });
}
