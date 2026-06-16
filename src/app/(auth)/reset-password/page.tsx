"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8 caractères min", ok: password.length >= 8 },
    { label: "Une majuscule", ok: /[A-Z]/.test(password) },
    { label: "Un chiffre", ok: /[0-9]/.test(password) },
    { label: "Un caractère spécial", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500"];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${i < score ? colors[score - 1] : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(({ label, ok }) => (
          <p key={label} className={`text-xs flex items-center gap-1 ${ok ? "text-green-600" : "text-muted-foreground"}`}>
            <CheckCircle className={`h-3 w-3 ${ok ? "opacity-100" : "opacity-30"}`} />
            {label}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Mot de passe mis à jour!");
    router.push("/dashboard");
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 space-y-4">
            <p className="text-muted-foreground">
              Lien invalide ou expiré. Demandez un nouveau lien de réinitialisation.
            </p>
            <Link href="/forgot-password" className={cn(buttonVariants(), "bg-[#0066CC]")}>
              Renvoyer un email
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <Heart className="h-8 w-8 text-[#0066CC]" />
            <span className="text-2xl font-bold text-[#0066CC]">HealthFlow</span>
          </Link>
          <CardTitle>Nouveau mot de passe</CardTitle>
          <CardDescription>Choisissez un mot de passe sécurisé</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && <PasswordStrength password={password} />}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmer</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className={confirm && confirm !== password ? "border-red-500" : ""}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-[#0066CC] hover:bg-[#0052a3]"
              disabled={loading || password !== confirm || password.length < 8}
            >
              {loading ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
