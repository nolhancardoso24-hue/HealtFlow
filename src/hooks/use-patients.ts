import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Patient } from "@/types/database";
import { toast } from "sonner";

async function fetchPatients(params?: {
  search?: string;
  status?: string;
  risk?: number;
  tag?: string;
}): Promise<Patient[]> {
  const url = new URL("/api/patients", window.location.origin);
  if (params?.search) url.searchParams.set("search", params.search);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.risk) url.searchParams.set("risk", String(params.risk));
  if (params?.tag) url.searchParams.set("tag", params.tag);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Erreur chargement patients");
  return res.json();
}

export function usePatients(params?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => fetchPatients(params),
    placeholderData: (prev) => prev,
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error("Patient introuvable");
      return res.json() as Promise<{ patient: Patient; appointments: unknown[] }>;
    },
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Patient>) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Patient>;
    },
    onSuccess: (newPatient) => {
      // Optimistic: ajouter immédiatement dans le cache
      qc.setQueryData<Patient[]>(["patients", undefined], (old) =>
        old ? [...old, newPatient] : [newPatient]
      );
      qc.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Patient ajouté");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Patient> & { id: string }) => {
      const res = await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<Patient>;
    },
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ["patient", id] });
      const previous = qc.getQueryData<{ patient: Patient }>(["patient", id]);
      qc.setQueryData(["patient", id], (old: { patient: Patient } | undefined) =>
        old ? { ...old, patient: { ...old.patient, ...data } } : old
      );
      return { previous };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previous) qc.setQueryData(["patient", id], ctx.previous);
      toast.error("Erreur lors de la mise à jour");
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["patient", id] });
      qc.invalidateQueries({ queryKey: ["patients"] });
    },
    onSuccess: () => toast.success("Patient mis à jour"),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["patients"] });
      const previous = qc.getQueryData<Patient[]>(["patients", undefined]);
      qc.setQueryData<Patient[]>(["patients", undefined], (old) =>
        old?.filter((p) => p.id !== id) ?? []
      );
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(["patients", undefined], ctx.previous);
      toast.error("Erreur lors de la suppression");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["patients"] }),
    onSuccess: () => toast.success("Patient supprimé"),
  });
}
