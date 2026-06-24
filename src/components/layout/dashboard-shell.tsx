"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Globe,
  Bot,
  Settings,
  Menu,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/layout/notification-bell";
import { TrialBanner } from "@/components/layout/trial-banner";
import { useState } from "react";

const primaryNavItems = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/calendar", label: "Calendrier", icon: Calendar },
  { href: "/booking", label: "Réservation en ligne", icon: Globe },
  { href: "/ai", label: "Assistant IA", icon: Bot },
];

const secondaryNavItems = [
  { href: "/settings", label: "Paramètres", icon: Settings },
];

function NavLinkList({
  items,
  onNavigate,
}: {
  items: typeof primaryNavItems;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-[#0066CC]/10 text-[#0066CC]"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-5 w-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardShell({
  children,
  practitionerName,
  trialDaysLeft,
}: {
  children: React.ReactNode;
  practitionerName: string;
  trialDaysLeft: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-64 flex-col border-r bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <Heart className="h-6 w-6 text-[#0066CC]" />
          <span className="text-lg font-bold text-[#0066CC]">HealthFlow</span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="flex-1">
            <NavLinkList items={primaryNavItems} />
          </div>
          <div className="border-t pt-4">
            <NavLinkList items={secondaryNavItems} />
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} />}
        <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center gap-2 border-b px-6">
                  <Heart className="h-6 w-6 text-[#0066CC]" />
                  <span className="text-lg font-bold text-[#0066CC]">HealthFlow</span>
                </div>
                <div className="flex h-full flex-col p-4">
                  <div className="flex-1">
                    <NavLinkList items={primaryNavItems} onNavigate={() => setOpen(false)} />
                  </div>
                  <div className="border-t pt-4">
                    <NavLinkList items={secondaryNavItems} onNavigate={() => setOpen(false)} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold">Bonjour, {practitionerName}</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
