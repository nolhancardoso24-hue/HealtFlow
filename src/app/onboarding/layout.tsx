import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getProfile();

  if (!user) redirect("/login");
  if (profile?.onboarding_completed) redirect("/dashboard");

  return <>{children}</>;
}
