import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Appointment } from "@/types/database";
import { format } from "date-fns";
import { toast } from "sonner";

export function useAppointments(dateFrom: Date, dateTo: Date) {
  return useQuery({
    queryKey: ["appointments", format(dateFrom, "yyyy-MM-dd"), format(dateTo, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await fetch(
        `/api/appointments?date_from=${format(dateFrom, "yyyy-MM-dd")}&date_to=${format(dateTo, "yyyy-MM-dd")}`
      );
      if (!res.ok) throw new Error("Erreur chargement RDV");
      return res.json() as Promise<Appointment[]>;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Appointment>) => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Appointment>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("RDV créé");
    },
    onError: () => toast.error("Erreur création RDV"),
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Appointment> & { id: string }) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Appointment>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Erreur mise à jour RDV"),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("RDV supprimé");
    },
    onError: () => toast.error("Erreur suppression RDV"),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Erreur dashboard");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
