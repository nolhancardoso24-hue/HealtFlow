"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
  const [upgrading, setUpgrading] = useState(false);

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

  async function handleUpgradePro() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro", interval: "monthly" }),
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
      setUpgrading(false);
    }
  }

  const isProActive =
    billing?.subscription_plan === "pro" && billing?.subscription_status === "active";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Abonnement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Chargement...</p>
        ) : billing ? (
          <>
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

            {isProActive ? (
              <p className="text-sm font-medium text-green-700">
                Vous êtes déjà sur le plan Pro
              </p>
            ) : (
              <Button
                type="button"
                className="bg-[#0066CC] hover:bg-[#0052a3]"
                disabled={upgrading}
                onClick={handleUpgradePro}
              >
                {upgrading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  "Passer à Pro"
                )}
              </Button>
            )}
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
