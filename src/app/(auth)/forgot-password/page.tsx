"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
    toast.success("Email de réinitialisation envoyé");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto mb-4 flex items-center gap-2">
            <Heart className="h-8 w-8 text-[#0066CC]" />
            <span className="text-2xl font-bold text-[#0066CC]">HealthFlow</span>
          </Link>
          <CardTitle>Mot de passe oublié</CardTitle>
          <CardDescription>
            {sent
              ? "Vérifiez votre boîte mail pour réinitialiser votre mot de passe."
              : "Entrez votre email pour recevoir un lien de réinitialisation."}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-[#0066CC] hover:bg-[#0052a3]" disabled={loading}>
                {loading ? "Envoi..." : "Envoyer le lien"}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm">
              <Link href="/login" className="text-[#0066CC] hover:underline">
                Retour à la connexion
              </Link>
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
