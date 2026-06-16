"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Erreur critique</h1>
          <p className="text-slate-500">L&apos;application a rencontré une erreur inattendue.</p>
          <button
            onClick={reset}
            className="rounded-md bg-[#0066CC] px-4 py-2 text-white hover:bg-[#0052a3]"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
