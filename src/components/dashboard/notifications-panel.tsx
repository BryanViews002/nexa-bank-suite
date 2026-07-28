import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Notification } from "@/lib/services";
import { cn } from "@/lib/utils";

export function NotificationsPanel() {
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  const unread = notifications?.filter((n: Notification) => !n.read).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description={unread ? `${unread} unread` : "All caught up."}
        actions={unread > 0 ? (
          <button type="button" onClick={() => markAll.mutate()} className="btn btn-sm"
            disabled={markAll.isPending}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </button>
        ) : undefined}
      />

      {!notifications?.length ? (
        <div className="surface">
          <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {notifications.map((n: Notification) => (
            <div key={n.id} className={cn("flex items-start gap-4 px-5 py-4",
              !n.read && "bg-primary/5")}>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.read && (
                <button type="button" onClick={() => markRead.mutate(n.id)}
                  className="btn btn-sm shrink-0" disabled={markRead.isPending}>
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
