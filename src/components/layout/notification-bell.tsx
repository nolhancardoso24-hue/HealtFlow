"use client";

import Link from "next/link";
import { Bell, BellRing, Inbox } from "lucide-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  risk: "Alerte risque",
  action: "Action requise",
  trend: "Tendance",
  info: "Information",
};

const typeStyles: Record<string, { badge: string; accent: string }> = {
  risk: {
    badge: "bg-red-50 text-red-700 ring-red-100",
    accent: "border-l-red-400",
  },
  action: {
    badge: "bg-orange-50 text-orange-700 ring-orange-100",
    accent: "border-l-orange-400",
  },
  trend: {
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
    accent: "border-l-blue-400",
  },
  info: {
    badge: "bg-slate-100 text-slate-700 ring-slate-200",
    accent: "border-l-[#0066CC]",
  },
};

function NotificationSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-slate-100">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex animate-pulse gap-3 px-4 py-4">
          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-200" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-4 w-full rounded bg-slate-200" />
            <div className="h-3 w-3/4 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Inbox className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-700">Aucune notification</p>
      <p className="mt-1 max-w-[240px] text-xs leading-relaxed text-muted-foreground">
        Les alertes patients, réservations et rappels apparaîtront ici.
      </p>
    </div>
  );
}

interface NotificationItemProps {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
  onRead: (id: string) => void;
}

function NotificationItem({
  id,
  type,
  title,
  message,
  is_read,
  link,
  created_at,
  onRead,
}: NotificationItemProps) {
  const styles = typeStyles[type] ?? typeStyles.info;
  const createdAt = parseISO(created_at);
  const relativeTime = formatDistanceToNow(createdAt, { addSuffix: true, locale: fr });
  const absoluteTime = format(createdAt, "d MMM yyyy · HH:mm", { locale: fr });

  const content = (
    <div
      className={cn(
        "group relative flex gap-3 border-l-[3px] px-4 py-3.5 transition-colors duration-150",
        "hover:bg-slate-50/90 focus-visible:bg-slate-50/90 focus-visible:outline-none",
        !is_read ? "bg-[#0066CC]/[0.04]" : "bg-white",
        styles.accent
      )}
    >
      <div className="flex shrink-0 pt-1.5">
        {!is_read ? (
          <span
            className="h-2 w-2 rounded-full bg-[#0066CC] shadow-[0_0_0_3px_rgba(0,102,204,0.15)]"
            aria-hidden
          />
        ) : (
          <span className="h-2 w-2 rounded-full bg-transparent" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
              styles.badge
            )}
          >
            {typeLabels[type] ?? typeLabels.info}
          </span>
          {!is_read && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-[#0066CC]">
              Nouveau
            </span>
          )}
        </div>

        <p className="text-sm font-semibold leading-snug text-slate-900">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-slate-600">{message}</p>

        <time
          className="mt-2 block text-xs text-muted-foreground"
          dateTime={created_at}
          title={absoluteTime}
        >
          {relativeTime}
        </time>
      </div>
    </div>
  );

  if (link) {
    return (
      <Link
        href={link}
        onClick={() => onRead(id)}
        className="block border-b border-slate-100 last:border-b-0"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onRead(id)}
      className="block w-full border-b border-slate-100 text-left last:border-b-0"
    >
      {content}
    </button>
  );
}

export function NotificationBell() {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-xl hover:bg-slate-100"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} non lues` : ""}`}
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-[#0066CC]" />
            ) : (
              <Bell className="h-5 w-5 text-slate-600" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0066CC] px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className={cn(
          "!w-[min(calc(100vw-1.5rem),400px)] min-w-[320px] max-w-[400px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0",
          "shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)] ring-0",
          "origin-top duration-300 ease-out",
          "data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-2",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:slide-out-to-top-1 data-closed:duration-200"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#0066CC]/10 px-2 py-0.5 text-xs font-medium text-[#0066CC]">
                {unreadCount} nouvelle{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-[#0066CC] hover:bg-[#0066CC]/10 hover:text-[#0066CC]"
              onClick={markAllRead}
            >
              Tout marquer lu
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[min(70vh,420px)]">
          {loading ? (
            <NotificationSkeleton />
          ) : notifications.length === 0 ? (
            <NotificationEmptyState />
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  {...notification}
                  onRead={markAsRead}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
