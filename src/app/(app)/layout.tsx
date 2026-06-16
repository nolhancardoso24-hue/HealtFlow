import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getBillingState } from "@/lib/billing";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getProfile();

  if (!user) redirect("/login");
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  // Vérification de l'essai / abonnement
  if (profile) {
    const billing = getBillingState(profile);
    if (billing.isExpired) {
      redirect("/pricing?expired=true");
    }
  }

  const name = profile ? `${profile.first_name}` : "Praticien";
  const billing = profile ? getBillingState(profile) : null;

  return (
    <DashboardShell
      practitionerName={name}
      trialDaysLeft={billing?.isTrial ? billing.trialDaysLeft : null}
    >
      {children}
    </DashboardShell>
  );
}
