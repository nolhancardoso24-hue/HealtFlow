"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Patient } from "@/types/database";
import { calculateAge } from "@/lib/segmentation";
import { format, parseISO } from "date-fns";

const emptyForm = {
  first_name: "",
  last_name: "",
  date_of_birth: "",
  phone: "",
  email: "",
  chief_complaint: "",
  medical_history: "",
};

function rowColor(patient: Patient) {
  if (patient.risk_level === "high" || patient.risk_level === "critical") return "bg-orange-50";
  if (patient.status === "inactive") return "bg-slate-50 opacity-60";
  return "";
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  async function loadPatients() {
    const res = await fetch("/api/patients");
    const data = await res.json();
    setPatients(data);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filtered = patients.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      toast.error("Erreur lors de la création");
      setLoading(false);
      return;
    }

    toast.success("Patient ajouté");
    setForm(emptyForm);
    setOpen(false);
    setLoading(false);
    loadPatients();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce patient?")) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    toast.success("Patient supprimé");
    loadPatients();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Patients</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button className="bg-[#0066CC] hover:bg-[#0052a3]">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau patient</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Prénom *</Label>
                  <Input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom *</Label>
                  <Input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date de naissance *</Label>
                <Input
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motif principal *</Label>
                <Input
                  value={form.chief_complaint}
                  onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Antécédents</Label>
                <Textarea
                  value={form.medical_history}
                  onChange={(e) => setForm({ ...form, medical_history: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full bg-[#0066CC]" disabled={loading}>
                {loading ? "Enregistrement..." : "Sauvegarder"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un patient..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Âge</TableHead>
              <TableHead className="hidden md:table-cell">Motif</TableHead>
              <TableHead className="hidden sm:table-cell">Séances</TableHead>
              <TableHead className="hidden lg:table-cell">Dernier RDV</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((patient) => (
              <TableRow key={patient.id} className={rowColor(patient)}>
                <TableCell className="font-medium">
                  <Link href={`/patients/${patient.id}`} className="hover:text-[#0066CC]">
                    {patient.first_name} {patient.last_name}
                  </Link>
                </TableCell>
                <TableCell>{calculateAge(patient.date_of_birth)}</TableCell>
                <TableCell className="hidden max-w-[200px] truncate md:table-cell">
                  {patient.chief_complaint}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{patient.total_appointments}</TableCell>
                <TableCell className="hidden lg:table-cell">
                  {patient.last_appointment_date
                    ? format(parseISO(patient.last_appointment_date), "dd/MM/yyyy")
                    : "—"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {patient.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(patient.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">Aucun patient trouvé.</p>
        )}
      </div>
    </div>
  );
}
