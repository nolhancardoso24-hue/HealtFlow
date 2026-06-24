import Link from "next/link";
import { Clock, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TrialBannerProps {
  daysLeft: number;
}

export function TrialBanner({ daysLeft }: TrialBannerProps) {
  const isUrgent = daysLeft <= 3;
  const progressPercent = Math.round(((14 - daysLeft) / 14) * 100);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b px-4 py-2 sm:flex-row sm:items-center sm:justify-between",
        isUrgent
          ? "border-orange-200 bg-orange-50 text-orange-900"
          : "border-blue-100 bg-blue-50 text-blue-900"
      )}
    >
      <div className="flex items-center gap-2 text-sm">
        <Clock className={cn("h-4 w-4 shrink-0", isUrgent ? "text-orange-500" : "text-blue-500")} />
        <span className="font-medium">
          {daysLeft === 0
            ? "Votre essai expire aujourd'hui"
            : daysLeft === 1
            ? "Dernier jour d'essai gratuit"
            : `${daysLeft} jours d'essai restants`}
        </span>
        {/* Barre de progression */}
        <div className="hidden sm:flex items-center gap-1.5">
          <div className="h-1.5 w-24 rounded-full bg-current/20">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isUrgent ? "bg-orange-500" : "bg-blue-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs opacity-70">{14 - daysLeft}/14 jours</span>
        </div>
      </div>

      <Link
        href="/pricing"
        className={cn(
          buttonVariants({ size: "sm" }),
          "shrink-0 gap-1.5",
          isUrgent
            ? "bg-orange-600 hover:bg-orange-700"
            : "bg-[#0066CC] hover:bg-[#0052a3]"
        )}
      >
        <Zap className="h-3.5 w-3.5" />
        Passer à Pro
      </Link>
    </div>
  );
}
