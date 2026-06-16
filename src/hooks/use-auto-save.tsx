import { useEffect, useRef, useState, useCallback } from "react";

type Status = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 1500,
  enabled = true,
}: UseAutoSaveOptions<T>) {
  const [status, setStatus] = useState<Status>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const isFirstRender = useRef(true);

  const save = useCallback(
    async (dataToSave: T) => {
      const serialized = JSON.stringify(dataToSave);
      if (serialized === lastSavedRef.current) return;

      setStatus("saving");
      try {
        await onSave(dataToSave);
        lastSavedRef.current = serialized;
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    },
    [onSave]
  );

  useEffect(() => {
    if (!enabled) return;
    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastSavedRef.current = JSON.stringify(data);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(data), debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, debounceMs, enabled, save]);

  return { status };
}

export function AutoSaveIndicator({ status }: { status: Status }) {
  if (status === "idle") return null;

  const config = {
    saving: { text: "Sauvegarde...", color: "text-muted-foreground" },
    saved: { text: "✓ Sauvegardé", color: "text-green-600" },
    error: { text: "Erreur de sauvegarde", color: "text-red-500" },
  } as const;

  const { text, color } = config[status] ?? { text: "", color: "" };

  return <span className={`text-xs transition-opacity ${color}`}>{text}</span>;
}
