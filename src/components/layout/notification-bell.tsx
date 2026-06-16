"use client";

import { Bell, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  risk: "bg-red-100 text-red-700",
  action: "bg-orange-100 text-orange-700",
  trend: "bg-blue-100 text-blue-700",
  info: "bg-slate-100 text-slate-700",
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      } />
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={markAllRead}>
              Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </p>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn("flex gap-3 px-4 py-3 transition-colors", !n.is_read && "bg-blue-50/50")}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-xs", typeColors[n.type] ?? typeColors.info)}>
                        {n.type}
                      </Badge>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true, locale: fr })}
                      </span>
                      {n.link && (
                        <Link
                          href={n.link}
                          className="inline-flex items-center gap-1 text-[11px] text-[#0066CC] hover:underline"
                          onClick={() => markAsRead(n.id)}
                        >
                          Voir <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => markAsRead(n.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
