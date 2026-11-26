import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, Copy, Loader2, Mail, RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getEmailDeliveryLogs, retryEmailLog } from "@/lib/notifications/notification.functions";

export function EmailAuditDialog({
  groupId,
  open,
  onOpenChange,
}: {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fetchLogs = useServerFn(getEmailDeliveryLogs);
  const retrySend = useServerFn(retryEmailLog);

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, accepted: 0, delivered: 0, bounced: 0, failed: 0, pending: 0 });
  const [tableMissing, setTableMissing] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  async function load() {
    if (!open) return;
    setLoading(true);
    try {
      const res = await fetchLogs({ data: { groupId, limit: 50 } });
      setLogs(res.logs);
      setStats(res.stats);
      setTableMissing(res.tableMissing);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load email logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      load();
    }
  }, [open, groupId]);

  async function handleRetry(logId: string) {
    setRetryingId(logId);
    try {
      const res = await retrySend({ data: { logId, groupId } });
      if (res.success) {
        toast.success(res.message);
        load();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setRetryingId(null);
    }
  }

  const filteredLogs = logs.filter((l) => {
    if (filter === "all") return true;
    return l.status === filter;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <DialogTitle className="text-lg">Email Delivery Audit Logs</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="h-8 px-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
          <DialogDescription className="text-xs">
            Real-time delivery verification powered by Resend API and webhooks.
          </DialogDescription>
        </DialogHeader>

        {tableMissing && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft/40 p-3 text-xs text-warning shrink-0">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4" />
              Database table <code>email_logs</code> has not been created yet
            </div>
            <p className="mt-1 text-muted-foreground">
              To record persistent audit logs and receive webhook delivery updates, open your Supabase SQL Editor and run the script in <code>supabase/email_logs.sql</code>.
            </p>
          </div>
        )}

        {/* Stats Filter Bar */}
        <div className="grid grid-cols-6 gap-1.5 text-center shrink-0">
          {[
            { label: "All", count: stats.total, val: "all" },
            { label: "Accepted", count: stats.accepted, val: "accepted", color: "text-blue-500" },
            { label: "Delivered", count: stats.delivered, val: "delivered", color: "text-success" },
            { label: "Delayed", count: 0, val: "delayed", color: "text-amber-500" },
            { label: "Bounced", count: stats.bounced, val: "bounced", color: "text-destructive" },
            { label: "Failed", count: stats.failed, val: "failed", color: "text-destructive" },
          ].map((item) => (
            <button
              key={item.val}
              type="button"
              onClick={() => setFilter(item.val)}
              className={`rounded-lg border p-1.5 transition ${filter === item.val ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted text-muted-foreground"}`}
            >
              <div className="text-[10px] font-semibold uppercase">{item.label}</div>
              <div className={`text-base font-bold ${filter === item.val ? "text-primary-foreground" : item.color || "text-foreground"}`}>
                {item.count}
              </div>
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-2 mt-2 pr-1">
          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto h-5 w-5 animate-spin mb-2" />
              Loading delivery logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No email logs found for this filter.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const statusColor =
                log.status === "delivered"
                  ? "bg-success/15 text-success border-success/30"
                  : log.status === "accepted"
                    ? "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400"
                    : log.status === "bounced" || log.status === "failed"
                      ? "bg-destructive/15 text-destructive border-destructive/30"
                      : "bg-amber-500/15 text-amber-600 border-amber-500/30";

              return (
                <div key={log.id} className="rounded-xl border p-3 text-xs bg-card space-y-1.5 hover:border-border transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{log.subject}</div>
                      <div className="text-muted-foreground truncate">
                        To: {log.recipient_name ? `${log.recipient_name} (${log.recipient_email})` : log.recipient_email}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                        {log.status === "delivered" && <CheckCircle2 className="h-3 w-3" />}
                        {log.status === "accepted" && <Clock className="h-3 w-3" />}
                        {(log.status === "failed" || log.status === "bounced") && <ShieldAlert className="h-3 w-3" />}
                        {log.status}
                      </span>
                      {log.status === "failed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-[10px]"
                          disabled={retryingId === log.id}
                          onClick={() => handleRetry(log.id)}
                          title="Retry email"
                        >
                          {retryingId === log.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {log.error_message && (
                    <div className="rounded bg-destructive/10 text-destructive p-1.5 text-[11px]">
                      {log.error_message}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                    <div className="flex items-center gap-2">
                      {log.resend_email_id ? (
                        <span className="flex items-center gap-1">
                          <span>Resend ID:</span>
                          <code className="bg-muted px-1 rounded">{log.resend_email_id.slice(0, 12)}...</code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(log.resend_email_id);
                              toast.success("Resend ID copied");
                            }}
                            className="hover:text-foreground"
                          >
                            <Copy className="h-2.5 w-2.5" />
                          </button>
                        </span>
                      ) : (
                        <span>Direct send</span>
                      )}
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      {log.delivered_at && ` · Delivered ${formatDistanceToNow(new Date(log.delivered_at), { addSuffix: true })}`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
