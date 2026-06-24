import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { getStripeConfigStatus } from "@/lib/stripe/config";
import { stripeLog, stripeLogError } from "@/lib/stripe/logger";
import {
  syncProfileFromCheckoutSession,
  syncProfileFromSubscription,
} from "@/lib/stripe/subscription";

export const runtime = "nodejs";

export async function POST(request: Request) {
  stripeLog("webhook route hit", getStripeConfigStatus());

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    stripeLogError("webhook misconfigured", new Error("STRIPE_WEBHOOK_SECRET missing"));
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    stripeLogError("signature invalid", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  stripeLog("webhook received", { event_id: event.id, event_type: event.type });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription") {
          await syncProfileFromCheckoutSession(session);
        } else {
          stripeLog("checkout ignored (non-subscription)", { session_id: session.id });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await syncProfileFromSubscription(subscription);
        break;
      }
      default:
        stripeLog("event ignored", { event_type: event.type });
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    stripeLogError("handler failed", err, { event_type: event.type, event_id: event.id });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  stripeLog("webhook processed", { event_id: event.id, event_type: event.type });
  return NextResponse.json({ received: true });
}
