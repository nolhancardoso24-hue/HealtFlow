"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart, Check, X, Zap, Shield, AlertTriangle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BILLING_PLANS,
  type BillingInterval,
  type BillingPlan,
  type BillingPlanId,
} from "@/lib/billing-plans";
import { BillingIntervalToggle } from "@/components/pricing/billing-interval-toggle";
import { PlanPriceDisplay } from "@/components/pricing/plan-price-display";

function PricingCard({
  plan,
  interval,
  loading,
  onSelect,
}: {
  plan: BillingPlan;
  interval: BillingInterval;
  loading: string | null;
  onSelect: (planId: BillingPlanId) => void;
}) {
  const isPopular = plan.id === "pro";
  const isLoading = loading === plan.id;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-lg",
        isPopular
          ? "z-10 border-[#0066CC] shadow-lg ring-2 ring-[#0066CC]/30 md:scale-[1.03]"
          : "border-slate-200"
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0066CC] px-4 py-1 text-white shadow-md">
          <Sparkles className="mr-1 h-3 w-3" />
          Le plus populaire
        </Badge>
      )}

      <div className="mb-6">
        <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          {isPopular && <Zap className="h-5 w-5 text-[#0066CC]" />}
          {plan.name}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
      </div>

      <div className="mb-6">
        <PlanPriceDisplay plan={plan} interval={interval} size="large" />
      </div>

      <ul className="mb-8 flex-1 space-y-3">
        {plan.comparisonFeatures.map(({ text, ok }) => (
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
          "w-full font-semibold transition-transform hover:scale-[1.02]",
          isPopular
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

  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSelect(planId: BillingPlanId) {
    setLoading(planId);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval }),
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

  const sortedPlans = [...BILLING_PLANS].sort((a, b) =>
    a.id === "pro" ? -1 : b.id === "pro" ? 1 : 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
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
        {isExpired && (
          <div className="mb-10 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div>
              <p className="font-semibold">Votre essai gratuit a expiré</p>
              <p className="mt-0.5 text-sm">
                Choisissez un plan pour continuer à utiliser HealthFlow et retrouver l&apos;accès à
                vos données.
              </p>
            </div>
          </div>
        )}

        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
            Choisissez votre plan
          </h1>
          <p className="mt-3 text-lg text-slate-500">
            Accès complet à toutes les fonctionnalités. Sans engagement.
          </p>

          <div className="mt-8 flex justify-center">
            <BillingIntervalToggle interval={interval} onChange={setInterval} />
          </div>

          {interval === "annual" && (
            <p className="mt-4 text-sm font-medium text-emerald-700">
              Facturation annuelle — économies jusqu&apos;à 95€ par an sur le plan Pro
            </p>
          )}
        </div>

        <div className="grid items-center gap-8 md:grid-cols-2">
          {sortedPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              interval={interval}
              loading={loading}
              onSelect={handleSelect}
            />
          ))}
        </div>

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

        <div className="mt-16 border-t pt-12">
          <h2 className="mb-6 text-center text-xl font-bold text-slate-900">
            Questions fréquentes
          </h2>
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
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">Chargement...</div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
