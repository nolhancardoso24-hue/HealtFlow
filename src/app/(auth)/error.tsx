"use client";

import { useEffect } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AuthError({
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
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <AlertTriangle className="h-7 w-7 text-orange-600" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Erreur d&apos;authentification</h2>
          <p className="text-sm text-slate-500">
            {error.message || "Une erreur est survenue. Veuillez réessayer."}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Réessayer
          </Button>
          <Link href="/login" className={cn(buttonVariants(), "bg-[#0066CC]")}>
            Connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
