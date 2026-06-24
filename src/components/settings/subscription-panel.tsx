"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, Crown, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BILLING_PLANS,
  PLAN_PRICING,
  type BillingInterval,
  type BillingPlanId,
  isStripePriceConfigured,
  type StripePriceAvailability,
} from "@/lib/billing-plans";
import { BillingIntervalToggle } from "@/components/pricing/billing-interval-toggle";
import { PlanPriceDisplay } from "@/components/pricing/plan-price-display";
import { planLabel, statusLabel } from "@/lib/stripe/labels";
import type { SubscriptionPlan, SubscriptionStatus } from "@/types/database";

type BillingInfo = {
  subscription_plan: SubscriptionPlan;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
};

function statusBadgeClass(status: SubscriptionStatus): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "trialing":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "cancelled":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "expired":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function SubscriptionPanelInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [priceAvailability, setPriceAvailability] = useState<StripePriceAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const [billingRes, configRes] = await Promise.all([
      fetch("/api/billing/upgrade"),
      fetch("/api/billing/config"),
    ]);

    if (billingRes.ok) {
      setBilling(await billingRes.json());
    }
    if (configRes.ok) {
      const data = await configRes.json();
      setPriceAvailability(data.prices ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const result = searchParams.get("billing");
    if (result === "success") {
      toast.success("Paiement réussi ! Votre abonnement est activé.");
      loadData();
      router.replace("/settings/subscription");
    } else if (result === "cancelled") {
      toast.info("Paiement annulé.");
      router.replace("/settings/subscription");
    }
  }, [searchParams, loadData, router]);

  async function handleSelectPlan(planId: BillingPlanId) {
    if (!isStripePriceConfigured(priceAvailability, planId, interval)) {
      toast.error(
        "Configuration Stripe manquante pour ce plan. Vérifiez les variables STRIPE_PRICE_ID_* sur le serveur."
      );
      return;
    }

    const isCurrentPlan =
      billing?.subscription_plan === planId && billing?.subscription_status === "active";
    if (isCurrentPlan) return;

    const loadingKey = `${planId}-${interval}`;
    setCheckoutLoading(loadingKey);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId, interval }),
      });
      const data = await res.json();

      if (!res.ok || !data.url) {
        toast.error(data.error ?? "Impossible de démarrer le paiement");
        return;
      }

      window.location.href = data.url;
    } catch {
      toast.error("Une erreur est survenue lors de la redirection vers Stripe");
    } finally {
      setCheckoutLoading(null);
    }
  }

  const configReady =
    priceAvailability &&
    (priceAvailability.starter.monthly ||
      priceAvailability.pro.monthly ||
      priceAvailability.starter.annual ||
      priceAvailability.pro.annual);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Abonnement</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Gérez votre plan et votre facturation Stripe
        </p>
      </div>

      {!configReady && !loading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Configuration Stripe manquante : les Price IDs ne sont pas tous définis sur le serveur.
        </div>
      )}

      {/* Abonnement actuel */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Abonnement actuel</CardTitle>
          <CardDescription>Votre plan et statut en temps réel</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </div>
          ) : billing ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {planLabel(billing.subscription_plan)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn("font-medium", statusBadgeClass(billing.subscription_status))}
                  >
                    {statusLabel(billing.subscription_status)}
                  </Badge>
                </div>
                {billing.subscription_status === "trialing" && billing.trial_ends_at && (
                  <p className="text-sm text-muted-foreground">
                    Essai gratuit jusqu&apos;au{" "}
                    <span className="font-medium text-slate-700">
                      {format(parseISO(billing.trial_ends_at), "d MMMM yyyy", { locale: fr })}
                    </span>
                  </p>
                )}
                {billing.subscription_ends_at && billing.subscription_status === "active" && (
                  <p className="text-sm text-muted-foreground">
                    Prochain renouvellement le{" "}
                    <span className="font-medium text-slate-700">
                      {format(parseISO(billing.subscription_ends_at), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </p>
                )}
                {billing.subscription_status === "active" &&
                  (billing.subscription_plan === "starter" ||
                    billing.subscription_plan === "pro") && (
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2 text-sm">
                      <p className="text-slate-600">
                        <span className="font-medium text-slate-800">
                          {PLAN_PRICING[billing.subscription_plan].monthlyPrice}€/mois
                        </span>
                        {" · "}
                        ou{" "}
                        <span className="font-medium text-emerald-700">
                          {PLAN_PRICING[billing.subscription_plan].annualTotal}€/an
                        </span>
                      </p>
                      {interval === "annual" && (
                        <p className="mt-1 font-medium text-emerald-700">
                          Économie annuelle : {PLAN_PRICING[billing.subscription_plan].annualDiscountPercent}%
                          de réduction — vous économisez{" "}
                          {PLAN_PRICING[billing.subscription_plan].annualSavings}€ par an
                        </p>
                      )}
                    </div>
                  )}
              </div>
              {billing.subscription_plan === "pro" && billing.subscription_status === "active" && (
                <div className="flex items-center gap-2 rounded-full bg-[#0066CC]/10 px-4 py-2 text-sm font-medium text-[#0066CC]">
                  <Crown className="h-4 w-4" />
                  Plan premium actif
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Impossible de charger l&apos;abonnement</p>
          )}
        </CardContent>
      </Card>

      {/* Changer de plan */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Changer de plan</h4>
            <p className="text-sm text-muted-foreground">
              Choisissez le plan adapté à votre cabinet
            </p>
          </div>

          <BillingIntervalToggle interval={interval} onChange={setInterval} />
        </div>

        <div className="grid items-center gap-6 pt-4 md:grid-cols-2">
          {[...BILLING_PLANS]
            .sort((a, b) => (a.id === "pro" ? -1 : b.id === "pro" ? 1 : 0))
            .map((plan) => {
            const isPopular = plan.id === "pro";
            const isCurrent =
              billing?.subscription_plan === plan.id &&
              billing?.subscription_status === "active";
            const priceOk = isStripePriceConfigured(priceAvailability, plan.id, interval);
            const loadingKey = `${plan.id}-${interval}`;
            const isLoading = checkoutLoading === loadingKey;

            return (
              <div key={plan.id} className="relative pt-4">
                {isPopular && (
                  <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
                    <Badge className="bg-[#0066CC] px-3 text-white shadow">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-0 right-4 z-20">
                    <Badge variant="outline" className="border-[#0066CC] bg-white text-[#0066CC]">
                      Plan actuel
                    </Badge>
                  </div>
                )}

              <Card
                className={cn(
                  "relative flex flex-col transition-all duration-200 hover:shadow-md",
                  isPopular && "z-10 border-[#0066CC]/50 shadow-lg ring-2 ring-[#0066CC]/20 md:scale-[1.02]",
                  isCurrent && "ring-2 ring-[#0066CC] ring-offset-2",
                  !priceOk && "opacity-75"
                )}
              >

                <CardHeader className="pb-2 pt-8">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    {plan.id === "pro" ? (
                      <Zap className="h-5 w-5 text-[#0066CC]" />
                    ) : null}
                    {plan.name}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-6">
                    <PlanPriceDisplay plan={plan} interval={interval} />
                  </div>

                  <ul className="mb-8 flex-1 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    type="button"
                    className={cn(
                      "w-full font-semibold transition-transform hover:scale-[1.02]",
                      isPopular
                        ? "bg-[#0066CC] hover:bg-[#0052a3]"
                        : "bg-slate-900 hover:bg-slate-800"
                    )}
                    disabled={isCurrent || isLoading || loading || !priceOk}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Redirection Stripe...
                      </>
                    ) : isCurrent ? (
                      "Plan actuel"
                    ) : !priceOk ? (
                      "Indisponible"
                    ) : (
                      `Passer à ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Paiement sécurisé par Stripe · Résiliation à tout moment
      </p>
    </div>
  );
}

export function SubscriptionPanel() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement de l&apos;abonnement...
        </div>
      }
    >
      <SubscriptionPanelInner />
    </Suspense>
  );
}
