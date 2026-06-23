"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SPECIALTIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>
    </Label>
  );
}

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  specialty: string;
  terms: boolean;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.firstName.trim()) errors.firstName = "Le prénom est obligatoire";
  if (!form.lastName.trim()) errors.lastName = "Le nom est obligatoire";
  if (!form.specialty) errors.specialty = "Veuillez choisir une spécialité";
  if (!form.email.trim()) {
    errors.email = "L'email est obligatoire";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Adresse email invalide";
  }
  if (!form.password) {
    errors.password = "Le mot de passe est obligatoire";
  } else if (form.password.length < 8) {
    errors.password = "Minimum 8 caractères";
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = "Veuillez confirmer le mot de passe";
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Les mots de passe ne correspondent pas";
  }
  if (!form.terms) {
    errors.terms = "Vous devez accepter les conditions pour continuer";
  }

  return errors;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    specialty: "",
    terms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (submitted) {
      setErrors(validateForm({ ...form, [field]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);

    const validationErrors = validateForm(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          specialty: form.specialty,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          specialty: form.specialty,
        }),
      });
    }

    toast.success("Compte créé! Vérifiez votre email pour confirmer.");
    router.push("/login");
  }

  const isFormComplete =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.specialty &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.confirmPassword &&
    form.password === form.confirmPassword &&
    form.terms;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <Heart className="h-8 w-8 text-[#0066CC]" />
            <span className="text-2xl font-bold text-[#0066CC]">HealthFlow</span>
          </Link>
          <CardTitle>Créer un compte</CardTitle>
          <CardDescription>
            Inscrivez-vous en tant que praticien — tous les champs sont obligatoires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="firstName">Prénom</RequiredLabel>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Jean"
                  autoComplete="given-name"
                  aria-invalid={!!errors.firstName}
                  className={cn(errors.firstName && "border-red-500 focus-visible:ring-red-500/30")}
                />
                {errors.firstName && (
                  <p className="text-xs text-red-500">{errors.firstName}</p>
                )}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="lastName">Nom</RequiredLabel>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Dupont"
                  autoComplete="family-name"
                  aria-invalid={!!errors.lastName}
                  className={cn(errors.lastName && "border-red-500 focus-visible:ring-red-500/30")}
                />
                {errors.lastName && (
                  <p className="text-xs text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="specialty">Spécialité</RequiredLabel>
              <NativeSelect
                id="specialty"
                value={form.specialty}
                onChange={(e) => update("specialty", e.target.value)}
                placeholder="Choisir une spécialité"
                aria-invalid={!!errors.specialty}
                className={cn(errors.specialty && "border-red-500 focus-visible:ring-red-500/30")}
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
              {errors.specialty && (
                <p className="text-xs text-red-500">{errors.specialty}</p>
              )}
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="email">Email professionnel</RequiredLabel>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="vous@cabinet.fr"
                autoComplete="email"
                aria-invalid={!!errors.email}
                className={cn(errors.email && "border-red-500 focus-visible:ring-red-500/30")}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="password">Mot de passe</RequiredLabel>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="8 caractères min."
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={!!errors.password}
                  className={cn(errors.password && "border-red-500 focus-visible:ring-red-500/30")}
                />
                {errors.password && (
                  <p className="text-xs text-red-500">{errors.password}</p>
                )}
              </div>
              <div className="space-y-2">
                <RequiredLabel htmlFor="confirmPassword">Confirmer</RequiredLabel>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => update("confirmPassword", e.target.value)}
                  placeholder="Répétez le mot de passe"
                  autoComplete="new-password"
                  minLength={8}
                  aria-invalid={!!errors.confirmPassword}
                  className={cn(errors.confirmPassword && "border-red-500 focus-visible:ring-red-500/30")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Encoche conditions — mise en avant */}
            <div
              className={cn(
                "rounded-xl border-2 p-4 transition-colors",
                errors.terms
                  ? "border-red-400 bg-red-50"
                  : form.terms
                  ? "border-green-400 bg-green-50"
                  : "border-[#0066CC]/40 bg-blue-50/60"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={form.terms}
                  onCheckedChange={(c) => update("terms", !!c)}
                  className="mt-0.5 size-5 border-2 data-checked:border-[#0066CC] data-checked:bg-[#0066CC]"
                  aria-invalid={!!errors.terms}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={cn("h-4 w-4", form.terms ? "text-green-600" : "text-[#0066CC]")} />
                    <Label htmlFor="terms" className="cursor-pointer text-sm font-semibold text-slate-800">
                      J&apos;accepte les conditions d&apos;utilisation
                      <span className="ml-0.5 text-red-500">*</span>
                    </Label>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    En cochant cette case, je confirme avoir lu et accepté les{" "}
                    <Link href="/terms" target="_blank" className="font-medium text-[#0066CC] underline underline-offset-2 hover:text-[#0052a3]">
                      conditions d&apos;utilisation
                    </Link>{" "}
                    et la{" "}
                    <Link href="/privacy" target="_blank" className="font-medium text-[#0066CC] underline underline-offset-2 hover:text-[#0052a3]">
                      politique de confidentialité (RGPD)
                    </Link>
                    .
                  </p>
                  {errors.terms && (
                    <p className="text-xs font-medium text-red-600">{errors.terms}</p>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-[#0066CC] hover:bg-[#0052a3]"
              disabled={loading || !isFormComplete}
            >
              {loading ? "Création..." : "Créer mon compte"}
            </Button>
            {!isFormComplete && !loading && (
              <p className="text-center text-xs text-muted-foreground">
                Remplissez tous les champs et acceptez les conditions pour continuer
              </p>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrit?{" "}
            <Link href="/login" className="text-[#0066CC] hover:underline">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
