import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getProfile();

  if (!user) redirect("/login");
  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const name = profile ? `${profile.first_name}` : "Praticien";

  return <DashboardShell practitionerName={name}>{children}</DashboardShell>;
}
