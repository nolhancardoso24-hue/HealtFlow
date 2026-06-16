"use client";

import { useEffect, useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
  setHours,
  setMinutes,
} from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import type { Appointment, Patient } from "@/types/database";
import { SESSION_DURATIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  scheduled: "bg-[#0066CC]",
  completed: "bg-[#10B981]",
  cancelled: "bg-slate-400",
  "no-show": "bg-red-500",
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [form, setForm] = useState({
    patient_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00",
    duration_minutes: "45",
    reason: "",
    notes: "",
    send_reminder: true,
  });

  const loadAppointments = useCallback(async () => {
    const from = format(startOfMonth(currentDate), "yyyy-MM-dd");
    const to = format(endOfMonth(currentDate), "yyyy-MM-dd");
    const res = await fetch(`/api/appointments?date_from=${from}&date_to=${to}`);
    setAppointments(await res.json());
  }, [currentDate]);

  useEffect(() => {
    loadAppointments();
    fetch("/api/patients").then((r) => r.json()).then(setPatients);
  }, [loadAppointments]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  function getAppointmentsForDay(day: Date) {
    return appointments.filter((a) => isSameDay(parseISO(a.date_time), day));
  }

  function openCreate(day?: Date) {
    setSelectedApt(null);
    setForm({
      patient_id: "",
      date: format(day ?? new Date(), "yyyy-MM-dd"),
      time: "09:00",
      duration_minutes: "45",
      reason: "",
      notes: "",
      send_reminder: true,
    });
    setDialogOpen(true);
  }

  function openEdit(apt: Appointment) {
    setSelectedApt(apt);
    const dt = parseISO(apt.date_time);
    setForm({
      patient_id: apt.patient_id,
      date: format(dt, "yyyy-MM-dd"),
      time: format(dt, "HH:mm"),
      duration_minutes: String(apt.duration_minutes),
      reason: apt.reason ?? "",
      notes: apt.notes ?? "",
      send_reminder: false,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const [h, m] = form.time.split(":").map(Number);
    const dateTime = setMinutes(setHours(parseISO(form.date), h), m);

    const payload = {
      patient_id: form.patient_id,
      date_time: dateTime.toISOString(),
      duration_minutes: parseInt(form.duration_minutes),
      reason: form.reason,
      notes: form.notes,
      send_reminder: form.send_reminder,
    };

    const url = selectedApt ? `/api/appointments/${selectedApt.id}` : "/api/appointments";
    const method = selectedApt ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(selectedApt ? "RDV modifié" : "RDV créé");
      setDialogOpen(false);
      loadAppointments();
    } else {
      toast.error("Erreur");
    }
  }

  async function handleDelete() {
    if (!selectedApt || !confirm("Supprimer ce RDV?")) return;
    await fetch(`/api/appointments/${selectedApt.id}`, { method: "DELETE" });
    toast.success("RDV supprimé");
    setDialogOpen(false);
    loadAppointments();
  }

  async function markAbsent() {
    if (!selectedApt) return;
    await fetch(`/api/appointments/${selectedApt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "no-show", is_absent: true }),
    });
    toast.success("Marqué absent");
    setDialogOpen(false);
    loadAppointments();
  }

  async function markCompleted() {
    if (!selectedApt) return;
    await fetch(`/api/appointments/${selectedApt.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", notes: form.notes }),
    });
    toast.success("Séance terminée");
    setDialogOpen(false);
    loadAppointments();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Calendrier</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("month")}
          >
            Mois
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("week")}
          >
            Semaine
          </Button>
          <Button className="bg-[#0066CC]" size="sm" onClick={() => openCreate()}>
            <Plus className="mr-1 h-4 w-4" />
            Nouveau RDV
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold capitalize">
          {format(currentDate, "MMMM yyyy", { locale: fr })}
        </h3>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <div className="grid grid-cols-7 border-b">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="p-2 text-center text-sm font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dayAppts = getAppointmentsForDay(day);
            const inMonth = isSameMonth(day, currentDate);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[100px] border-b border-r p-1 cursor-pointer hover:bg-slate-50",
                  !inMonth && "bg-slate-50/50 text-muted-foreground"
                )}
                onDoubleClick={() => openCreate(day)}
              >
                <span className="text-sm font-medium">{format(day, "d")}</span>
                <div className="mt-1 space-y-0.5">
                  {dayAppts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      className={cn(
                        "truncate rounded px-1 py-0.5 text-xs text-white",
                        statusColors[apt.status] ?? "bg-[#0066CC]"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(apt);
                      }}
                    >
                      {format(parseISO(apt.date_time), "HH:mm")}{" "}
                      {apt.patient?.first_name}
                    </div>
                  ))}
                  {dayAppts.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{dayAppts.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedApt ? "Détails RDV" : "Nouveau rendez-vous"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Patient</Label>
              <NativeSelect
                value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                placeholder="Choisir un patient"
                required
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Durée</Label>
              <NativeSelect
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              >
                {SESSION_DURATIONS.map((d) => (
                  <option key={d} value={String(d)}>{d} min</option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label>Motif</Label>
              <Input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {!selectedApt && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="reminder"
                  checked={form.send_reminder}
                  onCheckedChange={(c) => setForm({ ...form, send_reminder: !!c })}
                />
                <Label htmlFor="reminder">Envoyer rappel email au patient</Label>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="bg-[#0066CC]">
                Sauvegarder
              </Button>
              {selectedApt && (
                <>
                  <Button type="button" variant="outline" onClick={markCompleted}>
                    Terminer séance
                  </Button>
                  <Button type="button" variant="outline" onClick={markAbsent}>
                    Marquer absent
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleDelete}>
                    Supprimer
                  </Button>
                </>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
