"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function QuestionnairePage() {
  const { token } = useParams<{ token: string }>();
  const [valid, setValid] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [form, setForm] = useState({
    relief_level: 5,
    side_effects: false,
    current_pain: 5,
    exercises_done: "yes" as "yes" | "partial" | "no",
    comments: "",
  });

  useEffect(() => {
    fetch(`/api/questionnaires/${token}`)
      .then((r) => r.json())
      .then((data) => {
        setValid(data.valid);
        setPatientName(data.patientName ?? "");
        if (data.alreadySubmitted) setSubmitted(true);
      });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/questionnaires/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setSubmitted(true);
      toast.success("Merci pour votre réponse!");
    } else {
      toast.error("Erreur lors de l'envoi");
    }
    setLoading(false);
  }

  if (valid === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Ce lien a expiré ou n&apos;est plus valide.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md text-center">
          <CardContent className="flex flex-col items-center gap-4 pt-8">
            <CheckCircle className="h-16 w-16 text-[#10B981]" />
            <h2 className="text-xl font-bold">Merci!</h2>
            <p className="text-muted-foreground">
              Vos données nous aident à améliorer votre suivi.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#0066CC]" />
            <span className="font-bold text-[#0066CC]">HealthFlow</span>
          </div>
          <CardTitle>Questionnaire post-séance</CardTitle>
          <CardDescription>
            Bonjour {patientName}, ce questionnaire prend moins de 2 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label>Soulagement ressenti (1-10): {form.relief_level}</Label>
              <Slider
                value={[form.relief_level]}
                onValueChange={(value) => {
                  const v = Array.isArray(value) ? value[0] : value;
                  setForm({ ...form, relief_level: v });
                }}
                min={1}
                max={10}
                step={1}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="side_effects"
                checked={form.side_effects}
                onCheckedChange={(c) => setForm({ ...form, side_effects: !!c })}
              />
              <Label htmlFor="side_effects">Avez-vous eu des effets secondaires?</Label>
            </div>

            <div className="space-y-3">
              <Label>Douleur actuelle (0-10): {form.current_pain}</Label>
              <Slider
                value={[form.current_pain]}
                onValueChange={(value) => {
                  const v = Array.isArray(value) ? value[0] : value;
                  setForm({ ...form, current_pain: v });
                }}
                min={0}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Exercices faits?</Label>
              <NativeSelect
                value={form.exercises_done}
                onChange={(e) => setForm({ ...form, exercises_done: e.target.value as "yes" | "partial" | "no" })}
              >
                <option value="yes">Oui, régulièrement</option>
                <option value="partial">Partiellement</option>
                <option value="no">Non</option>
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>Commentaires (optionnel)</Label>
              <Textarea
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="Autres sensations..."
              />
            </div>

            <Button type="submit" className="w-full bg-[#10B981] hover:bg-[#0d9668]" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
