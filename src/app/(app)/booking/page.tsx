"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Profile } from "@/types/database";

type BookingProfile = Partial<Profile> & { email?: string };

export default function BookingSettingsPage() {
  const [profile, setProfile] = useState<BookingProfile>({});
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/profile")
      .then((response) => response.json())
      .then(setProfile);
  }, []);

  const bookingPath = profile.id ? `/book/${profile.id}` : "";
  const bookingLink = bookingPath && origin ? `${origin}${bookingPath}` : bookingPath;

  async function copyBookingLink() {
    if (!bookingLink) return;
    await navigator.clipboard.writeText(bookingLink);
    toast.success("Lien de réservation copié");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Réservation en ligne</h2>
        <p className="text-sm text-muted-foreground">
          Partage une page publique liée directement à ton site pour que les patients puissent réserver un créneau libre.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lien public</CardTitle>
          <CardDescription>
            Ce lien peut être envoyé par message, ajouté sur ton site vitrine ou partagé sur tes réseaux.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Lien de réservation</Label>
            <Input value={bookingLink} readOnly placeholder="Le lien apparaîtra une fois le profil chargé" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={copyBookingLink} disabled={!bookingLink}>
              Copier le lien
            </Button>
            {bookingPath && (
              <Link
                href={bookingPath}
                target="_blank"
                className={buttonVariants({ className: "bg-[#0066CC] hover:bg-[#0052a3]" })}
              >
                Ouvrir la page publique
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment ça marche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Les créneaux affichés aux patients sont calculés à partir de tes horaires, de tes jours fermés et des rendez-vous déjà présents dans ton calendrier.
          </p>
          <p>
            Quand un patient réserve, le rendez-vous est ajouté directement dans HealthFlow et une notification apparaît dans la cloche en haut à droite.
          </p>
          <p>
            Pour ajuster les disponibilités visibles, modifie simplement tes horaires dans <span className="font-medium text-foreground">Paramètres</span>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
