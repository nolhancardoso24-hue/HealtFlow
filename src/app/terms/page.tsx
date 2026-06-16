import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-[#0066CC] hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Conditions d&apos;utilisation</h1>
      <div className="prose mt-6 space-y-4 text-muted-foreground">
        <p>
          En utilisant HealthFlow, vous acceptez les présentes conditions d&apos;utilisation.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Service</h2>
        <p>
          HealthFlow est une plateforme de gestion pour praticiens de santé. Elle ne remplace pas
          un avis médical et ne constitue pas un dispositif médical.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Responsabilités</h2>
        <p>
          Le praticien reste seul responsable des décisions cliniques prises avec ses patients.
          L&apos;assistant IA fournit des suggestions à titre indicatif uniquement.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Abonnement</h2>
        <p>
          Les tarifs Free, Starter et Pro sont décrits sur la page d&apos;accueil. L&apos;abonnement
          peut être résilié à tout moment.
        </p>
      </div>
    </div>
  );
}
