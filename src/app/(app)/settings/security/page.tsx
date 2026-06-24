"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function SecuritySettingsPage() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Sécurité</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Mot de passe et session de votre compte
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Mot de passe</CardTitle>
          <CardDescription>
            Modifiez votre mot de passe via un lien sécurisé envoyé par email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/forgot-password"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex no-underline"
            )}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Réinitialiser le mot de passe
          </Link>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
          <CardDescription>Déconnectez-vous de cet appareil</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
