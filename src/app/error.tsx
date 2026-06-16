"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Une erreur est survenue</h1>
          <p className="text-slate-500 text-sm">
            {error.message || "Quelque chose s'est mal passé. Veuillez réessayer."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="bg-[#0066CC] hover:bg-[#0052a3]">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
            <Home className="mr-2 h-4 w-4" />
            Tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
