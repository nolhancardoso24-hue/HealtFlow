import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Upsert: le trigger SQL peut déjà avoir créé le profil
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        first_name: body.first_name || "Praticien",
        last_name: body.last_name || "",
        specialty: body.specialty || "Autre",
        // Le trigger SQL initialise trial_ends_at et subscription_status
        // mais on le garantit aussi ici en cas de conflit
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: "trialing",
      },
      { onConflict: "user_id", ignoreDuplicates: true }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
