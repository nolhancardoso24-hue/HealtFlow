import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-[#0066CC] hover:underline">
        ← Retour
      </Link>
      <h1 className="mt-8 text-3xl font-bold">Politique de confidentialité</h1>
      <div className="prose mt-6 space-y-4 text-muted-foreground">
        <p>
          HealthFlow s&apos;engage à protéger vos données personnelles et celles de vos patients
          conformément au RGPD.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Données collectées</h2>
        <p>
          Nous collectons les informations nécessaires au fonctionnement du service: identité du
          praticien, données patients (nom, contact, informations cliniques), rendez-vous et
          réponses aux questionnaires.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Sécurité</h2>
        <p>
          Les données sont chiffrées en transit (HTTPS) et stockées de manière sécurisée sur
          Supabase. L&apos;accès est contrôlé par Row Level Security.
        </p>
        <h2 className="text-xl font-semibold text-foreground">Vos droits</h2>
        <p>
          Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos données en
          contactant support@healthflow.app.
        </p>
      </div>
    </div>
  );
}
