import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Paramètres</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre profil, la sécurité et votre abonnement
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <SettingsNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
