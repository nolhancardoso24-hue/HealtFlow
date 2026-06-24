"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, CreditCard, Loader2, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  BILLING_PLANS,
  PLAN_PRICING,
  type BillingInterval,
  type BillingPlanId,
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

function BillingCardInner({ onProfileRefresh }: { onProfileRefresh: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<BillingInterval>("annual");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadBilling = useCallback(async () => {
    const res = await fetch("/api/billing/upgrade");
    if (res.ok) {
      setBilling(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    const result = searchParams.get("billing");
    if (result === "success") {
      toast.success("Paiement réussi ! Votre abonnement est activé.");
      loadBilling();
      onProfileRefresh();
      router.replace("/settings");
    } else if (result === "cancelled") {
      toast.info("Paiement annulé.");
      router.replace("/settings");
    }
  }, [searchParams, loadBilling, onProfileRefresh, router]);

  async function handleSelectPlan(planId: BillingPlanId) {
    const isCurrent =
      billing?.subscription_plan === planId && billing?.subscription_status === "active";
    if (isCurrent) return;

    setCheckoutLoading(planId);
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
      toast.error("Une erreur est survenue");
    } finally {
      setCheckoutLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Abonnement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : billing ? (
          <>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Plan actuel</span>
                <Badge variant="secondary">{planLabel(billing.subscription_plan)}</Badge>
                <Badge
                  className={
                    billing.subscription_status === "active"
                      ? "bg-green-100 text-green-800"
                      : billing.subscription_status === "trialing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                  }
                >
                  {statusLabel(billing.subscription_status)}
                </Badge>
              </div>

              {billing.subscription_status === "trialing" && billing.trial_ends_at && (
                <p className="text-sm text-muted-foreground">
                  Essai jusqu&apos;au{" "}
                  {format(parseISO(billing.trial_ends_at), "d MMMM yyyy", { locale: fr })}
                </p>
              )}

              {billing.subscription_ends_at && billing.subscription_status === "active" && (
                <p className="text-sm text-muted-foreground">
                  Prochain renouvellement :{" "}
                  {format(parseISO(billing.subscription_ends_at), "d MMMM yyyy", { locale: fr })}
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
                        {PLAN_PRICING[billing.subscription_plan].annualDiscountPercent}% de
                        réduction — vous économisez{" "}
                        {PLAN_PRICING[billing.subscription_plan].annualSavings}€ par an
                      </p>
                    )}
                  </div>
                )}
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-slate-900">Changer de plan</p>
                <BillingIntervalToggle interval={interval} onChange={setInterval} />
              </div>

              <div className="grid gap-4 pt-2 sm:grid-cols-2">
                {[...BILLING_PLANS]
                  .sort((a, b) => (a.id === "pro" ? -1 : b.id === "pro" ? 1 : 0))
                  .map((plan) => {
                    const isPopular = plan.id === "pro";
                    const isCurrent =
                      billing.subscription_plan === plan.id &&
                      billing.subscription_status === "active";
                    const isLoading = checkoutLoading === plan.id;

                    return (
                      <div
                        key={plan.id}
                        className={cn(
                          "relative rounded-xl border p-4",
                          isPopular && "border-[#0066CC]/50 ring-1 ring-[#0066CC]/20",
                          isCurrent && "ring-2 ring-[#0066CC]"
                        )}
                      >
                        {isPopular && (
                          <Badge className="absolute -top-2.5 left-3 bg-[#0066CC] px-2 text-xs text-white">
                            <Sparkles className="mr-1 h-3 w-3" />
                            Le plus populaire
                          </Badge>
                        )}

                        <div className={cn("space-y-3", isPopular && "pt-2")}>
                          <h4 className="flex items-center gap-1.5 font-semibold">
                            {isPopular && <Zap className="h-4 w-4 text-[#0066CC]" />}
                            {plan.name}
                          </h4>

                          <PlanPriceDisplay plan={plan} interval={interval} />

                          <ul className="space-y-1.5">
                            {plan.features.slice(0, 4).map((feature) => (
                              <li
                                key={feature}
                                className="flex items-start gap-1.5 text-xs text-slate-600"
                              >
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          <Button
                            type="button"
                            size="sm"
                            className={cn(
                              "w-full",
                              isPopular
                                ? "bg-[#0066CC] hover:bg-[#0052a3]"
                                : "bg-slate-900 hover:bg-slate-800"
                            )}
                            disabled={isCurrent || isLoading}
                            onClick={() => handleSelectPlan(plan.id)}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redirection...
                              </>
                            ) : isCurrent ? (
                              "Plan actuel"
                            ) : (
                              `Passer à ${plan.name}`
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Impossible de charger l&apos;abonnement</p>
        )}
      </CardContent>
    </Card>
  );
}

export function BillingCard({ onProfileRefresh }: { onProfileRefresh: () => void }) {
  return (
    <Suspense
      fallback={
        <Card>
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      }
    >
      <BillingCardInner onProfileRefresh={onProfileRefresh} />
    </Suspense>
  );
}
