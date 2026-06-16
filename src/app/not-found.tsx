import Link from "next/link";
import { Heart, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md text-center space-y-6">
        <Link href="/" className="mx-auto flex items-center justify-center gap-2">
          <Heart className="h-8 w-8 text-[#0066CC]" />
          <span className="text-2xl font-bold text-[#0066CC]">HealthFlow</span>
        </Link>
        <div className="space-y-2">
          <p className="text-6xl font-extrabold text-[#0066CC]">404</p>
          <h1 className="text-2xl font-bold text-slate-900">Page introuvable</h1>
          <p className="text-slate-500">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
        </div>
        <Link href="/dashboard" className={cn(buttonVariants(), "bg-[#0066CC] hover:bg-[#0052a3]")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
