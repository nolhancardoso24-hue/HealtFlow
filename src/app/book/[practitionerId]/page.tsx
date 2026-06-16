"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock3, Heart, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface BookingSlot {
  time: string;
  label: string;
}

interface BookingDateOption {
  date: string;
  label: string;
  availableCount: number;
  isClosed: boolean;
}

interface BookingPayload {
  practitioner: {
    id: string;
    name: string;
    specialty: string;
    cabinetName: string | null;
    hoursStart: string | null;
    hoursEnd: string | null;
    sessionDuration: number;
  };
  dateOptions: BookingDateOption[];
  selectedDate: string;
  slots: BookingSlot[];
}

export default function BookingPage() {
  const { practitionerId } = useParams<{ practitionerId: string }>();
  const [data, setData] = useState<BookingPayload | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ date: string; time: string } | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    reason: "",
    notes: "",
  });

  const loadBooking = useCallback(async (date?: string) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    const response = await fetch(`/api/public/booking/${practitionerId}${query}`);
    const payload = await response.json();

    if (!response.ok) {
      toast.error(payload.error ?? "Réservation indisponible");
      setLoading(false);
      return;
    }

    setData(payload);
    setSelectedDate(payload.selectedDate);
    setSelectedTime((current) =>
      payload.slots.some((slot: BookingSlot) => slot.time === current) ? current : payload.slots[0]?.time ?? ""
    );
    setLoading(false);
  }, [practitionerId]);

  useEffect(() => {
    loadBooking();
  }, [loadBooking]);

  async function handleDateChange(date: string) {
    setLoading(true);
    await loadBooking(date);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!selectedDate || !selectedTime) {
      toast.error("Choisis d'abord un créneau disponible");
      return;
    }

    setSubmitting(true);

    const response = await fetch(`/api/public/booking/${practitionerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: selectedDate,
        time: selectedTime,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      toast.error(payload?.error ?? "Impossible de finaliser la réservation");
      setSubmitting(false);
      await handleDateChange(selectedDate);
      return;
    }

    setSuccess({ date: payload.date, time: payload.time });
    setSubmitting(false);
  }

  const selectedDateLabel = useMemo(
    () => data?.dateOptions.find((option) => option.date === selectedDate)?.label ?? selectedDate,
    [data?.dateOptions, selectedDate]
  );

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <p className="text-sm text-muted-foreground">Chargement de la page de réservation...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Réservation indisponible</CardTitle>
            <CardDescription>Ce lien public n&apos;est pas accessible pour le moment.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className="text-sm text-[#0066CC] hover:underline">
              Revenir au site
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-2 text-[#0066CC]">
            <Heart className="h-6 w-6" />
            <span className="text-xl font-bold">HealthFlow</span>
          </div>
          <Card className="border-green-200 shadow-sm">
            <CardHeader>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <CardTitle>Réservation enregistrée</CardTitle>
              <CardDescription>Votre demande a bien été envoyée à {data.practitioner.name}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                <span className="font-medium">Créneau demandé :</span> {selectedDateLabel} à {success.time}
              </p>
              <p className="text-muted-foreground">
                Le praticien retrouvera directement cette réservation dans son calendrier.
              </p>
              <Link href="/" className="text-[#0066CC] hover:underline">
                Revenir à l&apos;accueil
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center gap-2 text-[#0066CC]">
          <Heart className="h-6 w-6" />
          <span className="text-xl font-bold">HealthFlow</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Prendre rendez-vous</CardTitle>
              <CardDescription>
                Réserve un créneau avec {data.practitioner.name}, {data.practitioner.specialty.toLowerCase()}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <UserRound className="h-4 w-4 text-[#0066CC]" />
                    Praticien
                  </div>
                  <p className="text-sm text-muted-foreground">{data.practitioner.name}</p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Clock3 className="h-4 w-4 text-[#0066CC]" />
                    Horaires
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {data.practitioner.hoursStart?.slice(0, 5) ?? "09:00"} - {data.practitioner.hoursEnd?.slice(0, 5) ?? "18:00"}
                  </p>
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <CalendarDays className="h-4 w-4 text-[#0066CC]" />
                    Durée
                  </div>
                  <p className="text-sm text-muted-foreground">{data.practitioner.sessionDuration} min</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Date</Label>
                <NativeSelect value={selectedDate} onChange={(e) => handleDateChange(e.target.value)}>
                  {data.dateOptions.map((option) => (
                    <option key={option.date} value={option.date} disabled={option.availableCount === 0}>
                      {option.label} {option.availableCount > 0 ? `(${option.availableCount} créneaux)` : "(complet)"}
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="space-y-3">
                <Label>Créneaux disponibles</Label>
                <div className="flex flex-wrap gap-2">
                  {data.slots.length > 0 ? (
                    data.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedTime(slot.time)}
                        className={cn(
                          "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                          selectedTime === slot.time
                            ? "border-[#0066CC] bg-[#0066CC] text-white"
                            : "border-slate-300 bg-white hover:border-[#0066CC] hover:text-[#0066CC]"
                        )}
                      >
                        {slot.label}
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun créneau disponible pour cette date.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
              <CardDescription>Renseignez vos coordonnées pour envoyer la demande de réservation.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Date de naissance</Label>
                  <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Motif</Label>
                  <Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Ex: douleur lombaire, bilan..." />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informations utiles à partager avant le rendez-vous" />
                </div>
                <Button type="submit" className="w-full bg-[#0066CC]" disabled={submitting || !selectedTime}>
                  {submitting ? "Envoi..." : "Confirmer la réservation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
