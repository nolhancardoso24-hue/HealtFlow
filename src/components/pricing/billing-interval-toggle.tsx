"use client";

import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/lib/billing-plans";

type BillingIntervalToggleProps = {
  interval: BillingInterval;
  onChange: (interval: BillingInterval) => void;
  className?: string;
};

export function BillingIntervalToggle({
  interval,
  onChange,
  className,
}: BillingIntervalToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border bg-white p-1 shadow-sm",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "rounded-full px-5 py-2 text-sm font-medium transition-all",
          interval === "monthly"
            ? "bg-[#0066CC] text-white shadow"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        Mensuel
      </button>
      <button
        type="button"
        onClick={() => onChange("annual")}
        className={cn(
          "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
          interval === "annual"
            ? "bg-[#0066CC] text-white shadow"
            : "text-slate-500 hover:text-slate-900"
        )}
      >
        Annuel
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-bold",
            interval === "annual"
              ? "bg-emerald-400 text-emerald-950"
              : "bg-emerald-100 text-emerald-700"
          )}
        >
          Meilleure offre
        </span>
      </button>
    </div>
  );
}
