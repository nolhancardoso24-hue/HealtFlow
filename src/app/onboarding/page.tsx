"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ChevronRight, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { DAYS_OF_WEEK, SESSION_DURATIONS } from "@/lib/constants";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hours_start: "09:00",
    hours_end: "18:00",
    session_duration_minutes: "45",
    days_closed: [5, 6] as number[],
    timezone: "Europe/Paris",
    language: "fr",
    email_reminders: true,
    report_format: "digital",
    csvFile: null as File | null,
  });

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      days_closed: prev.days_closed.includes(day)
        ? prev.days_closed.filter((d) => d !== day)
        : [...prev.days_closed, day],
    }));
  }

  async function finish() {
    setLoading(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hours_start: form.hours_start,
        hours_end: form.hours_end,
        session_duration_minutes: parseInt(form.session_duration_minutes),
        days_closed: form.days_closed,
        timezone: form.timezone,
        language: form.language,
        email_reminders: form.email_reminders,
      }),
    });

    if (!res.ok) {
      toast.error("Erreur lors de la configuration");
      setLoading(false);
      return;
    }

    if (form.csvFile) {
      const csvData = await form.csvFile.text();
      await fetch("/api/patients/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvData }),
      });
    }

    toast.success("Configuration terminée!");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Heart className="h-8 w-8 text-[#0066CC]" />
            <span className="text-2xl font-bold text-[#0066CC]">HealthFlow</span>
          </div>
          <CardTitle>Configuration de votre cabinet</CardTitle>
          <CardDescription>Étape {step} sur 3</CardDescription>
          <div className="mx-auto mt-4 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full ${s <= step ? "bg-[#0066CC]" : "bg-muted"}`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Début journée</Label>
                  <Input
                    type="time"
                    value={form.hours_start}
                    onChange={(e) => update("hours_start", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fin journée</Label>
                  <Input
                    type="time"
                    value={form.hours_end}
                    onChange={(e) => update("hours_end", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Durée standard séance</Label>
                <Select
                  value={form.session_duration_minutes}
                  onValueChange={(v) => v && update("session_duration_minutes", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_DURATIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jours fermés</Label>
                <div className="flex flex-wrap gap-3">
                  {DAYS_OF_WEEK.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={form.days_closed.includes(value)}
                        onCheckedChange={() => toggleDay(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fuseau horaire</Label>
                <Select value={form.timezone} onValueChange={(v) => v && update("timezone", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                    <SelectItem value="Europe/London">Europe/London</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Langue</Label>
                <Select value={form.language} onValueChange={(v) => v && update("language", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="email_reminders"
                  checked={form.email_reminders}
                  onCheckedChange={(c) => update("email_reminders", !!c)}
                />
                <Label htmlFor="email_reminders">Rappels patients par email</Label>
              </div>
              <div className="space-y-2">
                <Label>Format rapports</Label>
                <Select value={form.report_format} onValueChange={(v) => v && update("report_format", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="paper">Papier (A4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Importez vos patients existants (optionnel). Format CSV: Nom, Prénom,
                DateNaissance, MotifPrincipal
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => update("csvFile", e.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-muted-foreground">
                Vous pourrez aussi ajouter des patients manuellement depuis le tableau de bord.
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Retour
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button className="bg-[#0066CC] hover:bg-[#0052a3]" onClick={() => setStep(step + 1)}>
                Suivant
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="bg-[#10B981] hover:bg-[#0d9668]"
                onClick={finish}
                disabled={loading}
              >
                {loading ? "Finalisation..." : "Terminer"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
