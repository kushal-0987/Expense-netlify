import { useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle, Loader2, BellRing } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import type { Expense } from "@/lib/data/types";
import { CATEGORIES, type Category } from "@/lib/categories";
import { currencySymbol, minorToInput, parseMoney, formatPercent } from "@/lib/finance/money";
import { computeShares, evenPercents, type SplitMethod, type SplitRow } from "@/lib/finance/split";
import { saveExpense } from "@/lib/data/api";
import { notifyExpense } from "@/lib/notifications/notification.functions";
import { showBrowserNotification } from "@/lib/notifications/web-push";
import { nowTime, todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { cn } from "@/lib/utils";

const METHODS: { value: SplitMethod; label: string; hint: string }[] = [
  { value: "equal", label: "Equally", hint: "Everyone ticked pays the same" },
  { value: "exact", label: "Exact amounts", hint: "Type each person's amount" },
  { value: "percentage", label: "Percentages", hint: "Shares must total 100%" },
  { value: "individual", label: "One person", hint: "A personal expense" },
];

export function ExpenseForm({ expense }: { expense?: Expense | undefined }) {
  const { group, activeMembers, members, me, settings, fmt, refresh } = useGroup();
  const navigate = useNavigate();
  const sendNotify = useServerFn(notifyExpense);
  const [notifyPush, setNotifyPush] = useState(true);
  // Editing keeps members who have since become inactive but are on the expense.
  const formMembers = useMemo(() => {
    if (!expense) return activeMembers;
    const ids = new Set([expense.paid_by, ...expense.participants.map((p) => p.member_id)]);
    return members.filter((m) => m.status === "active" || ids.has(m.id));
  }, [expense, activeMembers, members]);

  const [title, setTitle] = useState(expense?.title ?? "");
  const [amount, setAmount] = useState(expense ? minorToInput(expense.amount_minor) : "");
  const [category, setCategory] = useState<Category>(expense?.category ?? "groceries");
  const [date, setDate] = useState(expense?.expense_date ?? todayISO());
  const [time, setTime] = useState(expense?.expense_time?.slice(0, 5) ?? nowTime());
  const [paidBy, setPaidBy] = useState(expense?.paid_by ?? me?.id ?? formMembers[0]?.id ?? "");
  const [method, setMethod] = useState<SplitMethod>(expense?.split_method ?? settings.default_split_method);
  const description = expense?.description ?? "";
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [individual, setIndividual] = useState(
    expense?.split_method === "individual" ? expense.participants[0]?.member_id ?? "" : me?.id ?? "",
  );
  const [rows, setRows] = useState<SplitRow[]>(() =>
    formMembers.map((m) => {
      const p = expense?.participants.find((x) => x.member_id === m.id);
      return {
        memberId: m.id,
        included: expense ? !!p : true,
        exact: p ? minorToInput(p.share_minor) : "",
        percent: p?.percentage_bps != null ? (p.percentage_bps / 100).toFixed(2) : "",
      };
    }),
  );
  const [busy, setBusy] = useState(false);
  const [tried, setTried] = useState(false);

  const amountMinor = parseMoney(amount);
  const result = computeShares(method, amountMinor, rows, individual);
  const shareOf = (id: string) => result.shares.find((s) => s.member_id === id)?.share_minor;

  function patchRow(id: string, patch: Partial<SplitRow>) {
    setRows((rs) => rs.map((r) => (r.memberId === id ? { ...r, ...patch } : r)));
  }

  function evenOut() {
    const included = rows.filter((r) => r.included);
    if (method === "percentage") {
      const p = evenPercents(included.length);
      let i = 0;
      setRows((rs) => rs.map((r) => (r.included ? { ...r, percent: p[i++] ?? "" } : r)));
    } else if (method === "exact" && amountMinor) {
      const equal = computeShares("equal", amountMinor, rows);
      setRows((rs) => rs.map((r) => {
        const s = equal.shares.find((x) => x.member_id === r.memberId);
        return s ? { ...r, exact: minorToInput(s.share_minor) } : r;
      }));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setTried(true);
    if (!title.trim()) return void toast.error("Give the expense a title");
    if (!amountMinor || amountMinor <= 0) return void toast.error("Enter a valid amount, e.g. 1250 or 1250.50");
    if (!paidBy) return void toast.error("Choose who paid");
    if (result.error) return void toast.error(result.error);
    setBusy(true);
    try {
      const savedId = await saveExpense({
        id: expense?.id ?? null,
        groupId: group.id,
        title: title.trim(),
        description: description.trim(),
        amountMinor,
        category,
        date,
        time: time || null,
        paidBy,
        splitMethod: method,
        notes: notes.trim(),
        participants: result.shares,
      });

      if (notifyPush && (savedId || expense?.id)) {
        const targetId = savedId || expense!.id;
        try {
          const res = await sendNotify({
            data: {
              expenseId: targetId,
              groupId: group.id,
              appUrl: typeof window !== "undefined" ? window.location.origin : undefined,
            },
          });
          toast.success(res.message);
          showBrowserNotification(`Expense Added: ${title.trim()}`, {
            body: `${fmt(amountMinor)} paid. Push notification sent to members.`,
          });
        } catch (pushErr) {
          console.warn("Could not dispatch push notification:", pushErr);
        }
      }

      await refresh();
      toast.success(expense ? "Expense updated" : "Expense added");
      navigate({ to: "/expenses" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the expense");
    } finally {
      setBusy(false);
    }
  }

  const symbol = currencySymbol(group.currency);

  return (
    <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="e-title">Title</Label>
              <Input id="e-title" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly groceries at Bhatbhateni" aria-invalid={tried && !title.trim()} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{symbol}</span>
                <Input id="e-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="tabular pl-11 text-base font-bold" aria-invalid={tried && !amountMinor} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2"><c.icon className="h-4 w-4" style={{ color: c.color }} />{c.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-date">Date</Label>
              <Input id="e-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="e-time">Time</Label>
              <Input id="e-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-primary-soft p-4 shadow-glow sm:col-span-2">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-gradient-primary" />
              <div className="space-y-2 pl-2">
                <Label className="text-sm font-bold uppercase tracking-wide text-primary">Paid by</Label>
                <div className="flex items-center gap-3">
                  {paidBy && <MemberAvatar name={formMembers.find((m) => m.id === paidBy)?.name ?? "?"} seed={paidBy} size="sm" />}
                  <Select value={paidBy} onValueChange={setPaidBy}>
                    <SelectTrigger className="h-11 flex-1 bg-card text-base font-semibold"><SelectValue placeholder="Choose who paid" /></SelectTrigger>
                    <SelectContent>
                      {formMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}{m.id === me?.id ? " (you)" : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>How should it be split?</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition",
                    method === m.value ? "border-primary bg-primary-soft ring-1 ring-primary" : "hover:bg-muted",
                  )}
                  aria-pressed={method === m.value}
                >
                  <div className={cn("text-sm font-bold", method === m.value && "text-primary")}>{m.label}</div>
                  <div className="text-xs text-muted-foreground">{m.hint}</div>
                </button>
              ))}
            </div>

            {method === "individual" ? (
              <div className="space-y-1.5">
                <Label>Whose expense is this?</Label>
                <Select value={individual} onValueChange={setIndividual}>
                  <SelectTrigger><SelectValue placeholder="Choose a person" /></SelectTrigger>
                  <SelectContent>
                    {formMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {individual && individual !== paidBy
                    ? "They'll owe the full amount to the person who paid."
                    : "If they paid it themselves, nobody's balance changes."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{rows.filter((r) => r.included).length} people selected</span>
                  {method !== "equal" && <Button type="button" variant="soft" size="sm" onClick={evenOut}>Split evenly</Button>}
                </div>
                <ul className="divide-y rounded-xl border">
                  {rows.map((r) => {
                    const m = formMembers.find((x) => x.id === r.memberId);
                    if (!m) return null;
                    const share = shareOf(r.memberId);
                    return (
                      <li key={r.memberId} className="flex items-center gap-3 px-3 py-2.5">
                        <Checkbox checked={r.included} onCheckedChange={(v) => patchRow(r.memberId, { included: v === true })} aria-label={`Include ${m.name}`} />
                        <MemberAvatar name={m.name} seed={m.id} size="sm" />
                        <span className={cn("flex-1 text-sm font-semibold", !r.included && "text-muted-foreground line-through")}>{m.name}</span>
                        {method === "exact" && r.included && (
                          <div className="relative w-32">
                            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{symbol}</span>
                            <Input inputMode="decimal" value={r.exact} onChange={(e) => patchRow(r.memberId, { exact: e.target.value })} className="tabular h-9 pl-9 text-right" placeholder="0.00" aria-label={`${m.name}'s amount`} />
                          </div>
                        )}
                        {method === "percentage" && r.included && (
                          <div className="relative w-24">
                            <Input inputMode="decimal" value={r.percent} onChange={(e) => patchRow(r.memberId, { percent: e.target.value })} className="tabular h-9 pr-7 text-right" placeholder="0" aria-label={`${m.name}'s percentage`} />
                            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        )}
                        {r.included && method !== "exact" && (
                          <span className="tabular w-28 text-right text-sm font-bold">{share !== undefined ? fmt(share) : "—"}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent>
            <Textarea rows={3} maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Receipt number, payment method, anything useful…" />
          </CardContent>
        </Card>
      </div>

      <div className="xl:sticky xl:top-24 xl:self-start">
        <Card>
          <CardHeader><CardTitle>Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Total</div>
              <div className="tabular text-3xl font-semibold">{fmt(amountMinor ?? 0)}</div>
            </div>
            <ul className="space-y-2 text-sm">
              {result.shares.map((s) => (
                <li key={s.member_id} className="flex justify-between">
                  <span>{formMembers.find((m) => m.id === s.member_id)?.name}{s.percentage_bps != null && <span className="text-muted-foreground"> · {formatPercent(s.percentage_bps)}</span>}</span>
                  <span className="tabular font-semibold">{fmt(s.share_minor)}</span>
                </li>
              ))}
            </ul>
            {result.error ? (
              <div className="flex gap-2 rounded-xl bg-warning-soft p-3 text-xs font-medium text-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>
                  {result.error}
                  {method === "exact" && result.remaining !== 0 && amountMinor ? ` (${fmt(Math.abs(result.remaining))} ${result.remaining > 0 ? "left" : "over"})` : ""}
                </span>
              </div>
            ) : (
              <div className="flex gap-2 rounded-xl bg-success-soft p-3 text-xs font-medium text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> Shares add up exactly.
              </div>
            )}
            <label className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary-soft/40 p-3 text-xs cursor-pointer hover:bg-primary-soft/60 transition">
              <Checkbox
                checked={notifyPush}
                onCheckedChange={(v) => setNotifyPush(!!v)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-0.5 select-none">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <BellRing className="h-3.5 w-3.5 text-primary" />
                  Push notification ({activeMembers.filter((m) => !!m.email).length} email + admin)
                </div>
                <div className="text-muted-foreground">
                  Sends email & in-app push alert with each person's share immediately.
                </div>
              </div>
            </label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => navigate({ to: "/expenses" })}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={busy}>
                {busy && <Loader2 className="animate-spin" />}
                {expense ? "Save changes" : "Add expense"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
