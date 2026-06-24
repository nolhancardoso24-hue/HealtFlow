"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, Zap, Sparkles } from "lucide-react";
import { BILLING_PLANS, type BillingInterval } from "@/lib/billing-plans";
import { BillingIntervalToggle } from "@/components/pricing/billing-interval-toggle";
import { PlanPriceDisplay } from "@/components/pricing/plan-price-display";

export function LandingPricing() {
  const [interval, setInterval] = useState<BillingInterval>("annual");

  const sortedPlans = [...BILLING_PLANS].sort((a, b) =>
    a.id === "pro" ? -1 : b.id === "pro" ? 1 : 0
  );

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-bold">Tarifs simples et transparents</h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
          14 jours d&apos;essai gratuit. Choisissez mensuel ou annuel.
        </p>

        <div className="mt-8 flex justify-center">
          <BillingIntervalToggle interval={interval} onChange={setInterval} />
        </div>

        {interval === "annual" && (
          <p className="mt-4 text-center text-sm font-medium text-emerald-700">
            Meilleure offre sur tous les plans annuels
          </p>
        )}

        <div className="mt-12 grid items-center gap-6 pt-4 md:grid-cols-2 md:gap-8">
          {sortedPlans.map((plan) => {
            const isPopular = plan.id === "pro";

            return (
              <div key={plan.id} className="relative pt-4">
                {isPopular && (
                  <div className="absolute top-0 left-1/2 z-20 -translate-x-1/2">
                    <Badge className="bg-[#0066CC] px-3 text-white shadow">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Le plus populaire
                    </Badge>
                  </div>
                )}

                <div
                  className={cn(
                    "rounded-xl border p-6 transition-all",
                    isPopular
                      ? "z-10 border-[#0066CC] bg-white shadow-xl ring-2 ring-[#0066CC]/25 md:scale-[1.02]"
                      : "bg-white shadow-sm"
                  )}
                >
                  <h3 className="flex items-center gap-2 text-xl font-bold">
                    {isPopular && <Zap className="h-5 w-5 text-[#0066CC]" />}
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

                  <div className="mt-5">
                    <PlanPriceDisplay plan={plan} interval={interval} />
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-[#10B981]" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/signup"
                    className={cn(
                      buttonVariants({ variant: isPopular ? "default" : "outline" }),
                      "mt-6 w-full font-semibold",
                      isPopular && "bg-[#0066CC] hover:bg-[#0052a3]"
                    )}
                  >
                    Essai gratuit 14 jours
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/pricing" className="font-medium text-[#0066CC] hover:underline">
            Voir le comparatif détaillé des fonctionnalités →
          </Link>
        </p>
      </div>
    </section>
  );
}
