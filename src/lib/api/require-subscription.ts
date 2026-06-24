import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBillingState } from "@/lib/billing";
import type { Profile } from "@/types/database";

export type PractitionerAccess =
  | { ok: true; userId: string; userEmail: string | undefined; profile: Profile; practitionerId: string }
  | { ok: false; response: NextResponse };

/** Bloque l'accès si l'essai est expiré ou l'abonnement annulé (403). */
export async function requireActiveSubscription(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<PractitionerAccess> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Profil introuvable" }, { status: 404 }),
    };
  }

  const billing = getBillingState(profile);
  if (billing.isExpired) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Votre essai gratuit a expiré. Choisissez un abonnement pour continuer.",
          code: "subscription_required",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    userEmail: user.email,
    profile,
    practitionerId: profile.id,
  };
}
