"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Send, Save } from "lucide-react";
import { toast } from "sonner";
import type { Patient, Appointment } from "@/types/database";
import { calculateAge } from "@/lib/segmentation";
import { format, parseISO } from "date-fns";

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch(`/api/patients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setPatient(data.patient);
        setAppointments(data.appointments ?? []);
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;

    const res = await fetch(`/api/patients/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patient),
    });

    if (res.ok) {
      toast.success("Patient mis à jour");
      setEditing(false);
    } else {
      toast.error("Erreur lors de la mise à jour");
    }
  }

  async function sendQuestionnaire(appointmentId: string) {
    const res = await fetch("/api/questionnaires/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ appointment_id: appointmentId }),
    });

    if (res.ok) toast.success("Questionnaire envoyé");
    else toast.error("Erreur lors de l'envoi");
  }

  if (!patient) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/patients" className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-2xl font-bold">
          {patient.first_name} {patient.last_name}
        </h2>
        <Badge
          variant={
            patient.risk_level === "high" || patient.risk_level === "critical"
              ? "destructive"
              : "secondary"
          }
        >
          Risque: {patient.risk_score}/100
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informations</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
              {editing ? "Annuler" : "Éditer"}
            </Button>
          </CardHeader>
          <CardContent>
            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Prénom</Label>
                    <Input
                      value={patient.first_name}
                      onChange={(e) => setPatient({ ...patient, first_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      value={patient.last_name}
                      onChange={(e) => setPatient({ ...patient, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Motif principal</Label>
                  <Input
                    value={patient.chief_complaint}
                    onChange={(e) => setPatient({ ...patient, chief_complaint: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Antécédents</Label>
                  <Textarea
                    value={patient.medical_history ?? ""}
                    onChange={(e) => setPatient({ ...patient, medical_history: e.target.value })}
                  />
                </div>
                <Button type="submit" className="bg-[#0066CC]">
                  <Save className="mr-2 h-4 w-4" />
                  Sauvegarder
                </Button>
              </form>
            ) : (
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Âge</dt>
                  <dd>{calculateAge(patient.date_of_birth)} ans</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{patient.email ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Téléphone</dt>
                  <dd>{patient.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Motif</dt>
                  <dd>{patient.chief_complaint}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Séances</dt>
                  <dd>{patient.total_appointments}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Tags</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {patient.tags?.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </dd>
                </div>
              </dl>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique séances</CardTitle>
          </CardHeader>
          <CardContent>
            {appointments.length ? (
              <ul className="space-y-3">
                {appointments.map((apt) => (
                  <li key={apt.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {format(parseISO(apt.date_time), "dd/MM/yyyy HH:mm")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.reason ?? "Consultation"} — {apt.status}
                        </p>
                        {apt.notes && (
                          <p className="mt-1 text-sm">{apt.notes}</p>
                        )}
                      </div>
                      {apt.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendQuestionnaire(apt.id)}
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Questionnaire
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Aucune séance enregistrée.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
