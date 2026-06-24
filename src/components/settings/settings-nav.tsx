"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/settings", label: "Profil", icon: User, exact: true as const },
  { href: "/settings/security", label: "Sécurité", icon: Shield, exact: false as const },
  { href: "/settings/subscription", label: "Abonnement", icon: CreditCard, exact: false as const },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 lg:w-56">
      <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[#0066CC]/10 text-[#0066CC]"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
