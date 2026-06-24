"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, Check, X, Zap, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    description: "Idéal pour un praticien solo",
    monthlyPrice: 29,
    annualPrice: 23,
    color: "border-slate-200",
    badgeClass: "",
    popular: false,
    features: [
      { text: "Jusqu'à 100 patients", ok: true },
      { text: "Calendrier & rendez-vous", ok: true },
      { text: "Questionnaires patients", ok: true },
      { text: "Rappels email automatiques", ok: true },
      { text: "Export CSV", ok: true },
      { text: "Assistant IA", ok: false },
      { text: "Analytics avancés", ok: false },
      { text: "Documents & stockage", ok: false },
      { text: "Support prioritaire", ok: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Cabinet complet, sans limites",
    monthlyPrice: 59,
    annualPrice: 47,
    color: "border-[#0066CC] ring-2 ring-[#0066CC]/20",
    badgeClass: "bg-[#0066CC] text-white",
    popular: true,
    features: [
      { text: "Patients illimités", ok: true },
      { text: "Calendrier & rendez-vous", ok: true },
      { text: "Questionnaires patients", ok: true },
      { text: "Rappels email automatiques", ok: true },
      { text: "Export CSV", ok: true },
      { text: "Assistant IA (Claude)", ok: true },
      { text: "Analytics avancés", ok: true },
      { text: "Documents & stockage 10 Go", ok: true },
      { text: "Support prioritaire", ok: true },
    ],
  },
];

function PricingCard({
  plan,
  annual,
  loading,
  onSelect,
}: {
  plan: (typeof PLANS)[0];
  annual: boolean;
  loading: string | null;
  onSelect: (planId: string) => void;
}) {
  const price = annual ? plan.annualPrice : plan.monthlyPrice;
  const isLoading = loading === plan.id;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-shadow hover:shadow-md",
        plan.color
      )}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0066CC] px-4 py-1 text-white">
          Le plus populaire
        </Badge>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
      </div>

      <div className="mb-6 flex items-end gap-1">
        <span className="text-4xl font-extrabold text-slate-900">{price}€</span>
        <span className="mb-1 text-slate-500">/mois</span>
        {annual && (
          <span className="mb-1 ml-2 text-sm font-medium text-green-600">
            -{Math.round(((plan.monthlyPrice - plan.annualPrice) / plan.monthlyPrice) * 100)}%
          </span>
        )}
      </div>
      {annual && (
        <p className="mb-6 -mt-4 text-xs text-slate-400">
          Soit {plan.annualPrice * 12}€/an — économisez {(plan.monthlyPrice - plan.annualPrice) * 12}€
        </p>
      )}

      <ul className="mb-8 flex-1 space-y-3">
        {plan.features.map(({ text, ok }) => (
          <li key={text} className="flex items-center gap-2 text-sm">
            {ok ? (
              <Check className="h-4 w-4 shrink-0 text-green-500" />
            ) : (
              <X className="h-4 w-4 shrink-0 text-slate-300" />
            )}
            <span className={ok ? "text-slate-700" : "text-slate-400"}>{text}</span>
          </li>
        ))}
      </ul>

      <Button
        onClick={() => onSelect(plan.id)}
        disabled={!!loading}
        className={cn(
          "w-full font-semibold",
          plan.popular
            ? "bg-[#0066CC] hover:bg-[#0052a3]"
            : "bg-slate-900 hover:bg-slate-700"
        )}
      >
        {isLoading ? (
          "Activation..."
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Choisir {plan.name}
          </>
        )}
      </Button>
    </div>
  );
}

function PricingContent() {
  const searchParams = useSearchParams();
  const isExpired = searchParams.get("expired") === "true";

  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelect(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval: annual ? "annual" : "monthly" }),
      });

      const data = await res.json();

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Erreur lors de la redirection vers Stripe");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-[#0066CC]" />
            <span className="text-xl font-bold text-[#0066CC]">HealthFlow</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900">
            Retour au dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16">
        {/* Bannière expiration */}
        {isExpired && (
          <div className="mb-10 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Votre essai gratuit a expiré</p>
              <p className="mt-0.5 text-sm">
                Choisissez un plan pour continuer à utiliser HealthFlow et retrouver l&apos;accès à vos données.
              </p>
            </div>
          </div>
        )}

        {/* Titre */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Choisissez votre plan
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Accès complet à toutes les fonctionnalités. Sans engagement.
          </p>

          {/* Toggle mensuel / annuel */}
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border bg-white p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-medium transition-colors",
                !annual ? "bg-[#0066CC] text-white shadow" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors",
                annual ? "bg-[#0066CC] text-white shadow" : "text-slate-500 hover:text-slate-900"
              )}
            >
              Annuel
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-bold",
                  annual ? "bg-green-400 text-green-900" : "bg-green-100 text-green-700"
                )}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Cartes */}
        <div className="grid gap-8 md:grid-cols-2">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              annual={annual}
              loading={loading}
              onSelect={handleSelect}
            />
          ))}
        </div>

        {/* Garantie */}
        <div className="mt-12 flex flex-col items-center gap-4 text-center text-sm text-slate-500 sm:flex-row sm:justify-center sm:gap-8">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Paiement sécurisé (Stripe)</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Résiliation à tout moment</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Données conformes RGPD</span>
          </div>
        </div>

        {/* FAQ rapide */}
        <div className="mt-16 border-t pt-12">
          <h2 className="mb-6 text-center text-xl font-bold text-slate-900">Questions fréquentes</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                q: "Que se passe-t-il à la fin de l'essai ?",
                a: "Sans abonnement, l'accès à l'application est suspendu. Vos données sont conservées 30 jours.",
              },
              {
                q: "Puis-je changer de plan ?",
                a: "Oui, à tout moment. Le changement prend effet immédiatement.",
              },
              {
                q: "Comment puis-je annuler ?",
                a: "Depuis les paramètres de votre compte, en un clic. Aucune question posée.",
              },
              {
                q: "Mes données sont-elles sécurisées ?",
                a: "Oui, hébergées en Europe (Supabase EU), chiffrées, conformes RGPD et HDS.",
              },
            ].map(({ q, a }) => (
              <div key={q} className="rounded-xl border bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-800">{q}</p>
                <p className="mt-2 text-sm text-slate-500">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Chargement...</div>}>
      <PricingContent />
    </Suspense>
  );
}
