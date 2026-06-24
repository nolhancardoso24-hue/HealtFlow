"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="w-full bg-[#0066CC] hover:bg-[#0052a3]"
      disabled={pending}
    >
      {pending ? "Connexion..." : "Se connecter"}
    </Button>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [state, formAction] = useFormState(loginAction, initialState);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError === "auth_callback_failed") {
      toast.error("La connexion a échoué. Réessayez ou utilisez email/mot de passe.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (state.error) {
      toast.error(state.error);
    }
  }, [state.error]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
          <Heart className="h-8 w-8 text-[#0066CC]" />
          <span className="text-2xl font-bold text-[#0066CC]">HealthFlow</span>
        </Link>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Accédez à votre espace praticien</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="text-[#0066CC] hover:underline">
              Mot de passe oublié?
            </Link>
          </div>
          <SubmitButton />
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte?{" "}
          <Link href="/signup" className="text-[#0066CC] hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
