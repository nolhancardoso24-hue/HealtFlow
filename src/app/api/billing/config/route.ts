import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/** Indique quels Price IDs Stripe sont configurés (sans exposer les clés secrètes). */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trim = (key: string) => Boolean(process.env[key]?.trim());

  return NextResponse.json({
    prices: {
      starter: {
        monthly: trim("STRIPE_PRICE_ID_STARTER"),
        annual: trim("STRIPE_PRICE_ID_STARTER_ANNUAL"),
      },
      pro: {
        monthly: trim("STRIPE_PRICE_ID_PRO"),
        annual: trim("STRIPE_PRICE_ID_PRO_ANNUAL"),
      },
    },
  });
}
