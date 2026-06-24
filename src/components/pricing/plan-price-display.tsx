import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getPlanPriceDisplay,
  type BillingInterval,
  type BillingPlan,
} from "@/lib/billing-plans";

type PlanPriceDisplayProps = {
  plan: BillingPlan;
  interval: BillingInterval;
  size?: "default" | "large";
  className?: string;
};

export function PlanPriceDisplay({
  plan,
  interval,
  size = "default",
  className,
}: PlanPriceDisplayProps) {
  const display = getPlanPriceDisplay(plan, interval);
  const isAnnual = interval === "annual";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-end gap-1">
        <span
          className={cn(
            "font-extrabold tracking-tight text-slate-900",
            size === "large" ? "text-4xl" : "text-3xl"
          )}
        >
          {display.amount}€
        </span>
        <span className="mb-1 text-slate-500">{display.periodLabel}</span>
        {isAnnual && display.discountPercent !== null && (
          <Badge className="mb-1 ml-1 border-emerald-200 bg-emerald-50 text-emerald-700">
            {display.discountPercent}% de réduction
          </Badge>
        )}
      </div>

      {isAnnual && display.annualSavings !== null && (
        <div className="space-y-1">
          <p className="text-sm font-medium text-emerald-700">
            Vous économisez {display.annualSavings}€ par an
          </p>
          <p className="text-xs text-muted-foreground">
            vs {display.monthlyReference}€/mois facturé mensuellement (
            {display.monthlyReference * 12}€/an)
          </p>
        </div>
      )}

      {!isAnnual && (
        <p className="text-xs text-muted-foreground">
          Ou {plan.annualTotal}€/an — économisez {plan.annualSavings}€
        </p>
      )}
    </div>
  );
}
