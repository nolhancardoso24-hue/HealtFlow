import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Calendar, Users, Bot, Shield, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestion patients",
    description: "Centralisez fiches patients, historique et segmentation automatique.",
  },
  {
    icon: Calendar,
    title: "Calendrier intelligent",
    description: "Planifiez vos rendez-vous et envoyez des rappels automatiques.",
  },
  {
    icon: Bot,
    title: "Assistant IA",
    description: "Résumés de séances, questions suggérées et détection des risques.",
  },
  {
    icon: Shield,
    title: "Conformité RGPD",
    description: "Données patients sécurisées avec chiffrement et accès contrôlé.",
  },
];

import { LandingPricing } from "@/components/landing/landing-pricing";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-[#0066CC]" />
            <span className="text-xl font-bold text-[#0066CC]">HealthFlow</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Fonctionnalités
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Tarifs
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Connexion
            </Link>
            <Link
              href="/signup"
              className={cn(buttonVariants(), "bg-[#0066CC] hover:bg-[#0052a3]")}
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-6xl">
            La plateforme intelligente pour{" "}
            <span className="text-[#0066CC]">praticiens de santé</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Mieux connaître vos patients, détecter les risques d&apos;abandon, automatiser les
            rappels et gagner du temps avec l&apos;assistance IA.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "bg-[#0066CC] hover:bg-[#0052a3]")}
            >
              Essai gratuit
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold">Tout ce dont vous avez besoin</h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Une solution complète pour les kinés, ostéopathes, médecins et autres praticiens
            indépendants.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-xl border bg-white p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#0066CC]/10">
                  <Icon className="h-6 w-6 text-[#0066CC]" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingPricing />

      <footer className="border-t bg-slate-50 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-[#0066CC]" />
            <span className="font-semibold text-[#0066CC]">HealthFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} HealthFlow. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">
              Confidentialité
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
