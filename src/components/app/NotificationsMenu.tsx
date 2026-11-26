import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellRing, CheckCheck, Handshake, Receipt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { notificationsQuery, qk } from "@/lib/data/queries";
import { markNotificationsRead } from "@/lib/data/api";
import { requestBrowserNotificationPermission } from "@/lib/notifications/web-push";
import { cn } from "@/lib/utils";

export function NotificationsMenu({ userId }: { userId: string }) {
  const { data = [] } = useQuery(notificationsQuery(userId));
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const unread = data.filter((n) => !n.read_at);

  async function markAll() {
    if (!unread.length) return;
    await markNotificationsRead(userId);
    queryClient.invalidateQueries({ queryKey: qk.notifications(userId) });
  }

  async function enableBrowserPush() {
    const perm = await requestBrowserNotificationPermission();
    if (perm === "granted") toast.success("Browser push notifications enabled!");
    else toast.info("Browser notifications not allowed or dismissed");
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ""}`}>
          <Bell className="h-5 w-5" />
          {unread.length > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-bold">Notifications</span>
          <Button variant="ghost" size="sm" onClick={markAll} disabled={!unread.length}>
            <CheckCheck /> Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto scrollbar-thin">
          {data.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">You're all caught up.</p>
          ) : (
            data.map((n) => {
              const Icon = n.type.startsWith("settlement") ? Handshake : Receipt;
              return (
                <button
                  key={n.id}
                  className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted", !n.read_at && "bg-primary-soft/50")}
                  onClick={async () => {
                    if (!n.read_at) {
                      await markNotificationsRead(userId, [n.id]);
                      queryClient.invalidateQueries({ queryKey: qk.notifications(userId) });
                    }
                    if (n.link === "/settlements") navigate({ to: "/settlements" });
                    else if (n.link === "/expenses") navigate({ to: "/expenses" });
                    else if (n.link === "/balances") navigate({ to: "/balances" });
                  }}
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    {n.body && <span className="block text-xs text-muted-foreground">{n.body}</span>}
                    <span className="mt-1 block text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </span>
                  </span>
                  {!n.read_at && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                </button>
              );
            })
          )}
        </div>
        {typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted" && (
          <div className="border-t p-2 bg-muted/30">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground justify-start gap-2" onClick={enableBrowserPush}>
              <BellRing className="h-3.5 w-3.5 text-primary" />
              Enable browser desktop alerts
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
