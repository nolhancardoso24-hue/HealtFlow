import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createSubscriptionCheckoutSession } from "@/lib/stripe/checkout";
import {
  getSelectedPriceIdDebug,
  getStripeConfigStatus,
  getStripePriceIdsForLog,
  previewStripeSecretKey,
} from "@/lib/stripe/config";
import { parseStripeError, toPublicStripeErrorMessage } from "@/lib/stripe/errors";
import { logStripeRawError, stripeLog, stripeLogError } from "@/lib/stripe/logger";

export const runtime = "nodejs";

function logCheckoutDebug(
  step: string,
  extra?: Record<string, string | number | boolean | null | undefined>
) {
  stripeLog(`[debug] ${step}`, extra);
}

export async function POST(request: Request) {
  const secretKey = previewStripeSecretKey();
  const priceIds = getStripePriceIdsForLog();

  logCheckoutDebug("create-checkout-session — config", {
    stripe_secret_key_defined: secretKey.defined,
    stripe_secret_key_prefix: secretKey.prefix,
    ...priceIds,
    ...getStripeConfigStatus(),
  });

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

  const selectedPrice = getSelectedPriceIdDebug(plan, interval);
  logCheckoutDebug("create-checkout-session — plan sélectionné", {
    user_id: user.id,
    plan,
    interval,
    price_env_key: selectedPrice.env_key,
    price_id: selectedPrice.price_id,
  });

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
      price_id: selectedPrice.price_id,
    });

    const session = await createSubscriptionCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      profileId: profile.id,
      plan,
      interval,
    });

    if (!session.url) {
      logCheckoutDebug("create-checkout-session — session sans URL", {
        session_id: session.id,
      });
      return NextResponse.json({ error: "Impossible de créer la session Stripe" }, { status: 500 });
    }

    logCheckoutDebug("create-checkout-session — succès", {
      user_id: user.id,
      plan,
      session_id: session.id,
      price_id: selectedPrice.price_id,
    });

    stripeLog("checkout session created", {
      user_id: user.id,
      plan,
      session_id: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logStripeRawError(err);

    const parsed = parseStripeError(err);

    logCheckoutDebug("create-checkout-session — erreur Stripe", {
      user_id: user.id,
      plan,
      interval,
      price_id: selectedPrice.price_id,
      stripe_secret_key_defined: secretKey.defined,
      stripe_secret_key_prefix: secretKey.prefix,
      error_message: parsed.message,
      stripe_type: parsed.type ?? null,
      stripe_code: parsed.code ?? null,
      stripe_status: parsed.statusCode ?? null,
      stripe_request_id: parsed.requestId ?? null,
      is_connection_error: parsed.isConnectionError,
    });

    stripeLogError("checkout session failed", err, {
      user_id: user.id,
      plan,
      interval,
      price_id: selectedPrice.price_id,
      stripe_type: parsed.type,
      stripe_code: parsed.code,
      stripe_request_id: parsed.requestId,
    });

    const message = toPublicStripeErrorMessage(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
