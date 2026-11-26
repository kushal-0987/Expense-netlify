import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink, Mail, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { NotificationDeliveryReport } from "@/lib/notifications/notification.functions";

export function NotificationReportDialog({
  report,
  open,
  onOpenChange,
  onOpenAudit,
}: {
  report: NotificationDeliveryReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenAudit?: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  if (!report) return null;

  const isAllSuccess = report.acceptedCount === report.totalRecipients && report.totalRecipients > 0;
  const isPartial = report.acceptedCount > 0 && report.failedCount > 0;
  const isAllFailed = report.failedCount > 0 && report.acceptedCount === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isAllSuccess ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-success-soft text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : isPartial ? (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <AlertCircle className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                <ShieldAlert className="h-5 w-5" />
              </div>
            )}
            <div>
              <DialogTitle className="text-base font-bold">
                {isAllSuccess
                  ? "Email Notifications Dispatched"
                  : isPartial
                    ? "Partial Email Delivery"
                    : !report.providerConfigured
                      ? "Emails Not Sent (Provider Unset)"
                      : "Email Delivery Failed"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {report.summaryMessage}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Missing Config Alert */}
        {!report.providerConfigured && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft/40 p-3 text-xs text-warning">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 shrink-0" />
              RESEND_API_KEY is not set in Vercel
            </div>
            <p className="mt-1 text-muted-foreground">
              In-app alerts were saved, but real emails cannot be sent until you add <code>RESEND_API_KEY</code> in Vercel Project Settings &rarr; Environment Variables.
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl border bg-muted/40 p-2.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase">Recipients</div>
            <div className="text-xl font-bold">{report.totalRecipients}</div>
          </div>
          <div className="rounded-xl border border-success/20 bg-success-soft/30 p-2.5">
            <div className="text-[11px] font-semibold text-success uppercase">Accepted</div>
            <div className="text-xl font-bold text-success">{report.acceptedCount}</div>
          </div>
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-2.5">
            <div className="text-[11px] font-semibold text-destructive uppercase">Failed</div>
            <div className="text-xl font-bold text-destructive">{report.failedCount}</div>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2.5">
            <div className="text-[11px] font-semibold text-muted-foreground uppercase">In-App</div>
            <div className="text-xl font-bold">{report.inAppDeliveredCount}</div>
          </div>
        </div>

        {/* Recipient Details Toggle */}
        {(report.accepted.length > 0 || report.failed.length > 0) && (
          <div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs text-muted-foreground justify-between px-1 h-8"
            >
              <span>Inspect Individual Recipients</span>
              {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showDetails && (
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {report.failed.map((f, i) => (
                  <div key={`f-${i}`} className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{f.name} ({f.email})</span>
                      <Badge variant="destructive" className="text-[10px] py-0">Failed</Badge>
                    </div>
                    {f.error && <p className="text-[11px] text-destructive mt-0.5">{f.error}</p>}
                  </div>
                ))}

                {report.accepted.map((a, i) => (
                  <div key={`a-${i}`} className="rounded-lg border border-success/20 bg-success-soft/20 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{a.name} ({a.email})</span>
                      <Badge variant="success" className="text-[10px] py-0">Accepted</Badge>
                    </div>
                    {a.emailId && (
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <span>Resend ID:</span>
                        <code className="bg-muted px-1 rounded">{a.emailId}</code>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(a.emailId!);
                            toast.success("Resend ID copied");
                          }}
                          className="hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {onOpenAudit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                onOpenChange(false);
                onOpenAudit();
              }}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View Delivery Logs
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
