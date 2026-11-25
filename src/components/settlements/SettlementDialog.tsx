import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { minorToInput, parseMoney, currencySymbol } from "@/lib/finance/money";
import { recordSettlement } from "@/lib/data/api";
import { todayISO } from "@/lib/dates";

export interface SettlementPrefill {
  payer?: string;
  receiver?: string;
  amountMinor?: number;
}

export function SettlementDialog({ open, onOpenChange, prefill }: { open: boolean; onOpenChange: (v: boolean) => void; prefill?: SettlementPrefill }) {
  const { group, activeMembers, me, isAdmin, refresh, can, balances, fmt, memberById } = useGroup();
  const [payer, setPayer] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [received, setReceived] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPayer(prefill?.payer ?? me?.id ?? "");
    setReceiver(prefill?.receiver ?? "");
    setAmount(prefill?.amountMinor ? minorToInput(prefill.amountMinor) : "");
    setDate(todayISO());
    setNotes("");
    setReceived(true);
  }, [open, prefill, me?.id]);

  const payerMember = memberById(payer);
  const receiverMember = memberById(receiver);
  // A regular member paying a signed-in person needs that person to confirm.
  const needsConfirmation = !isAdmin && payer === me?.id && !!receiverMember?.user_id;
  const status = needsConfirmation ? "pending" : received ? "completed" : "pending";

  async function submit(e: FormEvent) {
    e.preventDefault();
    const minor = parseMoney(amount);
    if (!payer || !receiver) return toast.error("Choose who paid and who received");
    if (payer === receiver) return toast.error("Payer and receiver must be different people");
    if (!minor || minor <= 0) return toast.error("Enter a valid amount");
    if (!can.recordSettlementBetween(payer, receiver)) return toast.error("You can only record settlements you're part of");
    setBusy(true);
    try {
      await recordSettlement({ groupId: group.id, payer, receiver, amountMinor: minor, date, notes: notes.trim(), status });
      toast.success(status === "pending" ? "Payment recorded — waiting for confirmation" : "Settlement recorded");
      await refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the settlement");
    } finally {
      setBusy(false);
    }
  }

  const payerBal = payer ? balances.get(payer)?.net ?? 0 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record a settlement</DialogTitle>
          <DialogDescription>Log money paid back between members to update everyone's balance.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="space-y-1.5">
              <Label>Paid by</Label>
              <Select value={payer} onValueChange={setPayer}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {activeMembers.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <ArrowRight className="mb-2.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1.5">
              <Label>Paid to</Label>
              <Select value={receiver} onValueChange={setReceiver}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {activeMembers.filter((m) => m.id !== payer).map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {payerMember && (
            <p className="text-xs text-muted-foreground">
              {payerMember.name}'s current balance: <span className={payerBal < 0 ? "font-bold text-destructive" : "font-bold text-success"}>{fmt(payerBal)}</span>
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="s-amount">Amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">{currencySymbol(group.currency)}</span>
                <Input id="s-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="tabular pl-11" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-date">Date</Label>
              <Input id="s-date" type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-notes">Notes (optional)</Label>
            <Textarea id="s-notes" rows={2} maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paid via eSewa" />
          </div>
          {needsConfirmation ? (
            <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs font-medium text-warning">
              {receiverMember?.name} will be asked to confirm they received this payment.
            </p>
          ) : (
            <label className="flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm">
              <span>
                <span className="font-semibold">Money already received</span>
                <span className="block text-xs text-muted-foreground">Turn off to keep it pending until confirmed.</span>
              </span>
              <Switch checked={received} onCheckedChange={setReceived} />
            </label>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="animate-spin" />}
              Record settlement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
