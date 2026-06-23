import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import { stripeLog, stripeLogError } from "@/lib/stripe/logger";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = (body.plan ?? "pro") as "pro" | "starter";
  const interval = (body.interval ?? "monthly") as "monthly" | "annual";

  if (!["pro", "starter"].includes(plan)) {
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
    stripeLog("create checkout session", {
      user_id: user.id,
      plan,
      interval,
      profile_id: profile.id,
    });

    const session = await createSubscriptionCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      profileId: profile.id,
      plan,
      interval,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
    }

    stripeLog("checkout session created", {
      user_id: user.id,
      plan,
      session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    stripeLogError("checkout session failed", err, { user_id: user.id, plan });
    const message = err instanceof Error ? err.message : "Erreur Stripe";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
