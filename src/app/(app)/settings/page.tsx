"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { SPECIALTIES, SESSION_DURATIONS, DAYS_OF_WEEK } from "@/lib/constants";
import type { Profile } from "@/types/database";

type SettingsProfile = Partial<Profile> & {
  email?: string;
};

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (res.ok) {
      setProfile(await res.json());
      toast.success("Paramètres sauvegardés");
    } else {
      const payload = await res.json().catch(() => null);
      toast.error(payload?.error ?? "Erreur");
    }
    setLoading(false);
  }

  function toggleDay(day: number) {
    const closed = profile.days_closed ?? [];
    setProfile({
      ...profile,
      days_closed: closed.includes(day)
        ? closed.filter((d) => d !== day)
        : [...closed, day],
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Profil</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Informations personnelles et préférences du cabinet
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Identité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Prénom</Label>
                <Input
                  value={profile.first_name ?? ""}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={profile.last_name ?? ""}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Spécialité</Label>
              <NativeSelect
                value={profile.specialty ?? ""}
                onChange={(e) =>
                  setProfile({ ...profile, specialty: e.target.value as Profile["specialty"] })
                }
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input
                value={profile.phone ?? ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email ?? ""}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="prenom@cabinet.fr"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Cabinet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Début journée</Label>
                <Input
                  type="time"
                  value={profile.hours_start?.slice(0, 5) ?? "09:00"}
                  onChange={(e) => setProfile({ ...profile, hours_start: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin journée</Label>
                <Input
                  type="time"
                  value={profile.hours_end?.slice(0, 5) ?? "18:00"}
                  onChange={(e) => setProfile({ ...profile, hours_end: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durée séance standard</Label>
              <NativeSelect
                value={String(profile.session_duration_minutes ?? 45)}
                onChange={(e) =>
                  setProfile({ ...profile, session_duration_minutes: parseInt(e.target.value) })
                }
              >
                {SESSION_DURATIONS.map((d) => (
                  <option key={d} value={String(d)}>
                    {d} min
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label>Jours fermés</Label>
              <div className="flex flex-wrap gap-3">
                {DAYS_OF_WEEK.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={(profile.days_closed ?? []).includes(value)}
                      onCheckedChange={() => toggleDay(value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id="email_reminders"
                checked={profile.email_reminders ?? true}
                onCheckedChange={(c) => setProfile({ ...profile, email_reminders: !!c })}
              />
              <Label htmlFor="email_reminders">Rappels email</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="sms_reminders"
                checked={profile.sms_reminders ?? false}
                onCheckedChange={(c) => setProfile({ ...profile, sms_reminders: !!c })}
              />
              <Label htmlFor="sms_reminders">Rappels SMS (bientôt)</Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="bg-[#0066CC] hover:bg-[#0052a3]" disabled={loading}>
          {loading ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </div>
  );
}
