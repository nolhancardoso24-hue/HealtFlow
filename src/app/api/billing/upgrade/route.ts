import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function getPractitionerId(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("id").eq("user_id", user.id).single();
  return profile?.id ?? null;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const practitionerId = await getPractitionerId(supabase);

  if (!practitionerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { plan, interval } = body as { plan: "starter" | "pro"; interval: "monthly" | "annual" };

  if (!["starter", "pro"].includes(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  // ─────────────────────────────────────────────────────────────────
  // TODO: Stripe integration
  // Remplacer ce bloc mock par:
  //   const session = await stripe.checkout.sessions.create({
  //     mode: "subscription",
  //     line_items: [{ price: PRICE_IDS[plan][interval], quantity: 1 }],
  //     success_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  //     cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  //   });
  //   return NextResponse.json({ url: session.url });
  // ─────────────────────────────────────────────────────────────────

  // Mock: activer l'abonnement directement
  const subscriptionEndsAt = new Date();
  if (interval === "annual") {
    subscriptionEndsAt.setFullYear(subscriptionEndsAt.getFullYear() + 1);
  } else {
    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: "active",
      subscription_plan: plan,
      subscription_ends_at: subscriptionEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", practitionerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, plan, interval });
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
