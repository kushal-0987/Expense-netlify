import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowRight, BellRing, Handshake, Loader2, Mail, MessageCircle, Scale, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { BalanceAmount } from "@/components/app/BalanceAmount";
import { EmptyState } from "@/components/app/EmptyState";
import { SettlementDialog, type SettlementPrefill } from "@/components/settlements/SettlementDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { simplifyDebts } from "@/lib/finance/balances";
import { PayDialog } from "@/components/payments/PayDialog";
import { reminderMessage, whatsappLink } from "@/lib/payments/esewa";
import type { Member } from "@/lib/data/types";
import { AiReminderDialog, type AiReminderTarget } from "@/components/payments/AiReminderDialog";
import { notifyDue, notifyAllDues, type NotificationDeliveryReport } from "@/lib/notifications/notification.functions";
import { showBrowserNotification } from "@/lib/notifications/web-push";
import { NotificationReportDialog } from "@/components/notifications/NotificationReportDialog";
import { EmailAuditDialog } from "@/components/notifications/EmailAuditDialog";

export const Route = createFileRoute("/_authenticated/_shell/balances")({
  head: () => ({ meta: [{ title: "Balances — Family Expense Tracker" }, { name: "description", content: "Who owes whom, and the fewest payments to settle up." }] }),
  component: BalancesPage,
});

function BalancesPage() {
  const { members, balances, fmt, memberName, memberById, me, can, group, isAdmin } = useGroup();
  const [pushOpen, setPushOpen] = useState(false);
  const [projected, setProjected] = useState(false);
  const [settle, setSettle] = useState<SettlementPrefill | null>(null);
  const [aiTarget, setAiTarget] = useState<AiReminderTarget | null>(null);
  const [pay, setPay] = useState<{ receiver: Member; amountText: string } | null>(null);
  const [report, setReport] = useState<NotificationDeliveryReport | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  const sendDueReminder = useServerFn(notifyDue);
  const sendAllDueReminders = useServerFn(notifyAllDues);
  const [remindingKey, setRemindingKey] = useState<string | null>(null);
  const [remindingAll, setRemindingAll] = useState(false);

  async function pushDueNotification(from: string, to: string, amount: number) {
    const debtor = memberById(from);
    if (!debtor?.email) {
      toast.error(`${memberName(from)} does not have an email address configured`);
      return;
    }
    const key = `${from}-${to}`;
    setRemindingKey(key);
    try {
      const res = await sendDueReminder({
        data: {
          groupId: group.id,
          debtorMemberId: from,
          receiverMemberId: to,
          amountMinor: amount,
          appUrl: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (res.success) {
        toast.success(res.message);
      } else if (!res.providerConfigured) {
        toast.warning(res.message);
      } else {
        toast.error(res.message);
      }
      showBrowserNotification(`Due Reminder: ${memberName(from)}`, {
        body: `Payment reminder of ${fmt(amount)} sent to ${debtor.email}.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send due reminder");
    } finally {
      setRemindingKey(null);
    }
  }

  async function pushAllDueNotifications() {
    if (suggestions.length === 0) return;
    setRemindingAll(true);
    try {
      const dues = suggestions.map((s) => ({
        debtorMemberId: s.from,
        receiverMemberId: s.to,
        amountMinor: s.amount,
      }));
      const res = await sendAllDueReminders({
        data: {
          groupId: group.id,
          dues,
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
      showBrowserNotification("Due Reminders Sent", {
        body: `Pushed notifications to ${res.acceptedCount} debtor(s) with valid email.`,
      });
      setPushOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to push reminders");
    } finally {
      setRemindingAll(false);
    }
  }

  function remindLink(from: string, to: string, amount: number) {
    const debtor = memberById(from);
    const receiver = memberById(to);
    const link = typeof window !== "undefined" ? `${window.location.origin}/join/${group.invite_token}` : undefined;
    const text = reminderMessage({
      debtorName: memberName(from),
      receiverName: memberName(to),
      amountText: fmt(amount),
      householdName: group.name,
      receiverEsewa: receiver?.esewa_phone,
      receiverHasQr: !!receiver?.esewa_qr_path,
      link,
    });
    return whatsappLink(text, debtor?.esewa_phone);
  }

  function openAi(from: string, to: string, amount: number) {
    setPushOpen(false);
    setAiTarget({
      groupId: group.id,
      debtorName: memberName(from),
      debtorEmail: memberById(from)?.email ?? null,
      receiverName: memberName(to),
      amountText: fmt(amount),
      householdName: group.name,
      receiverEsewa: memberById(to)?.esewa_phone ?? null,
      link: typeof window !== "undefined" ? `${window.location.origin}/join/${group.invite_token}` : undefined,
    });
  }

  const rows = members
    .map((m) => ({ m, b: balances.get(m.id) }))
    .filter((r): r is { m: (typeof members)[number]; b: NonNullable<typeof r.b> } => !!r.b)
    .filter((r) => r.m.status === "active" || r.b.net !== 0 || r.b.paid !== 0)
    .sort((a, b) => b.b.net - a.b.net);
  const value = (b: { net: number; projectedNet: number }) => (projected ? b.projectedNet : b.net);

  const owedTotal = rows.reduce((a, r) => a + Math.max(0, value(r.b)), 0);
  const pendingTotal = rows.reduce((a, r) => a + r.b.pendingIn, 0);
  const suggestions = useMemo(() => {
    try {
      return simplifyDebts(rows.map((r) => ({ memberId: r.m.id, net: value(r.b) })));
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balances, projected]);

  const myNet = me ? value(balances.get(me.id) ?? { net: 0, projectedNet: 0 }) : 0;

  return (
    <div>
      <PageHeader
        title="Balances"
        description="Positive means the person gets money back; negative means they owe the group."
        actions={
          <div className="flex flex-wrap items-center gap-2">
          {isAdmin && suggestions.length > 0 && (
            <Button onClick={() => setPushOpen(true)} className="bg-gradient-primary shadow-glow"><BellRing /> Push reminders</Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setAuditOpen(true)} className="h-9">
            <Mail className="h-4 w-4 mr-1.5" /> Email logs
          </Button>
          <label className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-semibold">
            <Switch checked={projected} onCheckedChange={setProjected} />
            Include pending settlements
          </label>
          </div>
        }
      />

      <Dialog open={pushOpen} onOpenChange={setPushOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Push reminders to everyone who owes
            </DialogTitle>
            <DialogDescription>
              Dispatch push and email reminders with balance and payment details to members who have dues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Button
              onClick={pushAllDueNotifications}
              disabled={remindingAll}
              className="w-full bg-gradient-primary shadow-glow"
            >
              {remindingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
              Push notification to all ({suggestions.length})
            </Button>
            <ul className="space-y-2 max-h-72 overflow-y-auto">
              {suggestions.map((t) => {
                const key = `${t.from}-${t.to}`;
                const debtor = memberById(t.from);
                const hasEmail = !!debtor?.email;
                return (
                  <li key={`p-${key}`} className="flex items-center gap-2.5 rounded-xl border p-2.5">
                    <MemberAvatar name={memberName(t.from)} seed={t.from} size="sm" />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-semibold text-sm truncate">{memberName(t.from)}</div>
                      <div className="text-muted-foreground truncate">
                        owes {memberName(t.to)} <span className="font-semibold text-primary">{fmt(t.amount)}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {debtor?.email ? debtor.email : "No email configured"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        disabled={!hasEmail || remindingKey === key}
                        onClick={() => pushDueNotification(t.from, t.to, t.amount)}
                        title={hasEmail ? `Send email & in-app push to ${debtor?.email}` : "Member needs an email address to receive push notifications"}
                      >
                        {remindingKey === key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <BellRing className="h-3.5 w-3.5" />
                        )}
                        Push
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <a href={remindLink(t.from, t.to, t.amount)} target="_blank" rel="noreferrer" title="WhatsApp reminder">
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openAi(t.from, t.to, t.amount)} title="AI email draft">
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Your balance" icon={myNet >= 0 ? TrendingUp : TrendingDown} tone={myNet > 0 ? "green" : myNet < 0 ? "red" : "blue"} value={fmt(myNet)} valueClassName={myNet > 0 ? "text-success" : myNet < 0 ? "text-destructive" : undefined} hint={myNet > 0 ? "Others owe you" : myNet < 0 ? "You owe the group" : "All settled"} />
        <StatCard label="Total outstanding" icon={Scale} tone="purple" value={fmt(owedTotal)} hint="Money still to be paid back" />
        <StatCard label="Pending confirmation" icon={Handshake} tone="amber" value={fmt(pendingTotal)} hint="Recorded but not yet confirmed" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <Card>
          <CardHeader><CardTitle>Member breakdown</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto px-0 pb-2">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-y bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Member</th>
                  <th className="px-3 py-3 text-right">Paid</th>
                  <th className="px-3 py-3 text-right">Share</th>
                  <th className="px-3 py-3 text-right">Settled out</th>
                  <th className="px-3 py-3 text-right">Settled in</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map(({ m, b }) => (
                  <tr key={m.id}>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <MemberAvatar name={m.name} seed={m.id} size="sm" />
                        <span className="font-semibold">{m.name}{m.id === me?.id && <span className="text-muted-foreground"> (you)</span>}</span>
                      </div>
                    </td>
                    <td className="tabular px-3 py-3 text-right">{fmt(b.paid)}</td>
                    <td className="tabular px-3 py-3 text-right">{fmt(b.share)}</td>
                    <td className="tabular px-3 py-3 text-right">{fmt(b.settlementsPaid)}</td>
                    <td className="tabular px-3 py-3 text-right">{fmt(b.settlementsReceived)}</td>
                    <td className="px-6 py-3 text-right"><BalanceAmount minor={value(b)} showLabel /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Settle up in {suggestions.length} {suggestions.length === 1 ? "payment" : "payments"}</CardTitle></CardHeader>
          <CardContent>
            {suggestions.length === 0 ? (
              <EmptyState icon={Handshake} title="Everyone is settled" body="There's nothing to pay back right now." />
            ) : (
              <ul className="space-y-3">
                {suggestions.map((t) => (
                  <li key={`${t.from}-${t.to}`} className="rounded-xl border p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <MemberAvatar name={memberName(t.from)} seed={t.from} size="xs" />
                      <span className="font-semibold">{memberName(t.from)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <MemberAvatar name={memberName(t.to)} seed={t.to} size="xs" />
                      <span className="font-semibold">{memberName(t.to)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="tabular text-lg font-semibold text-primary">{fmt(t.amount)}</span>
                      {can.recordSettlementBetween(t.from, t.to) && (
                        <Button size="sm" variant="soft" onClick={() => setSettle({ payer: t.from, receiver: t.to, amountMinor: t.amount })}>Record payment</Button>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 border-t pt-2">
                      {(() => {
                        const receiver = memberById(t.to);
                        return receiver && (receiver.esewa_phone || receiver.esewa_qr_path) ? (
                          <Button size="sm" variant="outline" onClick={() => setPay({ receiver, amountText: fmt(t.amount) })}><Wallet /> Pay on eSewa</Button>
                        ) : null;
                      })()}
                      {t.from !== me?.id && (
                        <>
                          <Button
                            size="sm"
                            variant="soft"
                            disabled={!memberById(t.from)?.email || remindingKey === `${t.from}-${t.to}`}
                            onClick={() => pushDueNotification(t.from, t.to, t.amount)}
                            title={memberById(t.from)?.email ? `Send push notification & email to ${memberById(t.from)?.email}` : "Add member email to send notification"}
                          >
                            {remindingKey === `${t.from}-${t.to}` ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <BellRing className="h-3.5 w-3.5" />
                            )}
                            Push notification
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <a href={remindLink(t.from, t.to, t.amount)} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
                          </Button>
                        </>
                      )}
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => openAi(t.from, t.to, t.amount)}><Sparkles /> AI email</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <AiReminderDialog target={aiTarget} onClose={() => setAiTarget(null)} />
      <PayDialog receiver={pay?.receiver ?? null} amountText={pay?.amountText} onClose={() => setPay(null)} />
      <SettlementDialog open={!!settle} onOpenChange={(v) => !v && setSettle(null)} prefill={settle ?? undefined} />

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
    </div>
  );
}
