import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BellRing, CalendarDays, Loader2, Pencil, Trash2, User } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import type { Expense } from "@/lib/data/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { CategoryBadge, CategoryIcon } from "./CategoryBadge";
import { formatDate, formatTime } from "@/lib/dates";
import { formatPercent } from "@/lib/finance/money";
import { deleteExpense } from "@/lib/data/api";
import { notifyExpense, type NotificationDeliveryReport } from "@/lib/notifications/notification.functions";
import { showBrowserNotification } from "@/lib/notifications/web-push";
import { NotificationReportDialog } from "@/components/notifications/NotificationReportDialog";
import { EmailAuditDialog } from "@/components/notifications/EmailAuditDialog";

const SPLIT_LABEL = { equal: "Split equally", exact: "Exact amounts", percentage: "By percentage", individual: "Individual expense" } as const;

export function ExpenseDetailDialog({ expense, onOpenChange }: { expense: Expense | null; onOpenChange: (v: boolean) => void }) {
  const { fmt, memberName, memberById, can, refresh, group } = useGroup();
  const navigate = useNavigate();
  const sendNotify = useServerFn(notifyExpense);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [report, setReport] = useState<NotificationDeliveryReport | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const e = expense;

  async function pushNotification() {
    if (!e) return;
    setNotifying(true);
    try {
      const res = await sendNotify({
        data: {
          expenseId: e.id,
          groupId: group.id,
          appUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      setReport(res);
      if (res.acceptedCount > 0) {
        toast.success(res.summaryMessage);
      } else if (!res.providerConfigured) {
        toast.warning(res.summaryMessage);
      } else {
        toast.error(res.summaryMessage);
      }
      showBrowserNotification(`Expense Notification: ${e.title}`, {
        body: `${fmt(e.amount_minor)} — Notification report available.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send push notification");
    } finally {
      setNotifying(false);
    }
  }

  async function remove() {
    if (!e) return;
    setBusy(true);
    try {
      await deleteExpense(e.id);
      toast.success("Expense deleted");
      await refresh();
      setConfirm(false);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog open={!!e} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          {e && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <CategoryIcon category={e.category} />
                  <div className="min-w-0 text-left">
                    <DialogTitle className="text-lg">{e.title}</DialogTitle>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <CategoryBadge category={e.category} />
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(e.expense_date)} {formatTime(e.expense_time)}</span>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              <div className="rounded-2xl bg-muted p-4">
                <div className="text-xs font-semibold text-muted-foreground">Total</div>
                <div className="tabular text-3xl font-semibold">{fmt(e.amount_minor)}</div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" /> Paid by <span className="font-semibold text-foreground">{memberName(e.paid_by)}</span> · {SPLIT_LABEL[e.split_method]}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-bold">Shares</div>
                <ul className="divide-y rounded-xl border">
                  {e.participants.map((p) => {
                    const m = memberById(p.member_id);
                    return (
                      <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                        <MemberAvatar name={m?.name ?? "?"} seed={p.member_id} size="xs" />
                        <span className="flex-1 text-sm">{m?.name ?? "Former member"}</span>
                        {p.percentage_bps != null && <span className="text-xs text-muted-foreground">{formatPercent(p.percentage_bps)}</span>}
                        <span className="tabular text-sm font-bold">{fmt(p.share_minor)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              {(e.description || e.notes) && (
                <div className="space-y-1 text-sm">
                  {e.description && <p>{e.description}</p>}
                  {e.notes && <p className="text-muted-foreground">Note: {e.notes}</p>}
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={pushNotification}
                  disabled={notifying}
                  className="border-primary/30 text-primary hover:bg-primary-soft"
                >
                  {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                  Push notification
                </Button>
                {can.editExpense(e) && (
                  <div className="flex gap-2">
                    <Button variant="danger-soft" size="sm" onClick={() => setConfirm(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
                    <Button size="sm" onClick={() => navigate({ to: "/expenses/$expenseId/edit", params: { expenseId: e.id } })}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <DialogTitle>Delete this expense?</DialogTitle>
            <AlertDialogDescription>Everyone's balance will be recalculated. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(ev) => { ev.preventDefault(); remove(); }} disabled={busy} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NotificationReportDialog
        report={report}
        open={!!report}
        onOpenChange={(v) => !v && setReport(null)}
        onOpenAudit={() => setAuditOpen(true)}
      />

      <EmailAuditDialog
        groupId={group.id}
        open={auditOpen}
        onOpenChange={setAuditOpen}
      />
    </>
  );
}
