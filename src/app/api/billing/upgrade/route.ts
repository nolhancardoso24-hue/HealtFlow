import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import { getStripeConfigStatus } from "@/lib/stripe/config";
import { toPublicStripeErrorMessage } from "@/lib/stripe/errors";
import { stripeLog, stripeLogError } from "@/lib/stripe/logger";

export const runtime = "nodejs";

export async function POST(request: Request) {
  stripeLog("billing upgrade route hit", getStripeConfigStatus());
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { plan, interval } = body as { plan: "starter" | "pro"; interval: "monthly" | "annual" };

  if (!["starter", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, subscription_plan, subscription_status")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  if (profile.subscription_plan === plan && profile.subscription_status === "active") {
    return NextResponse.json(
      { error: `Vous êtes déjà sur le plan ${plan === "pro" ? "Pro" : "Starter"}` },
      { status: 400 }
    );
  }

  try {
    stripeLog("create checkout session (billing)", {
      user_id: user.id,
      plan,
      interval: interval ?? "monthly",
    });

    const session = await createSubscriptionCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      profileId: profile.id,
      plan,
      interval: interval ?? "monthly",
    });

    if (!session.url) {
      return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    stripeLogError("billing upgrade failed", err, { user_id: user.id, plan });
    const message = toPublicStripeErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_plan, subscription_ends_at, trial_ends_at")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json(profile ?? {});
}
