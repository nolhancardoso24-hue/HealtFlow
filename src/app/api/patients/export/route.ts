import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateAge } from "@/lib/segmentation";
import { requireActiveSubscription } from "@/lib/api/require-subscription";

export async function GET() {
  const supabase = await createClient();
  const access = await requireActiveSubscription(supabase);
  if (!access.ok) return access.response;
  const { practitionerId } = access;

  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .eq("practitioner_id", practitionerId)
    .order("last_name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const headers = [
    "Nom", "Prénom", "Date naissance", "Âge", "Email", "Téléphone",
    "Motif principal", "Statut", "Score risque", "Tags", "Total séances", "Dernier RDV",
  ];

  const rows = (patients ?? []).map((p) => [
    p.last_name,
    p.first_name,
    p.date_of_birth,
    calculateAge(p.date_of_birth),
    p.email ?? "",
    p.phone ?? "",
    p.chief_complaint,
    p.status,
    p.risk_score,
    (p.tags ?? []).join("|"),
    p.total_appointments,
    p.last_appointment_date ?? "",
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")),
  ].join("\n");

  const BOM = "\uFEFF"; // UTF-8 BOM pour Excel
  return new Response(BOM + csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="patients_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
