import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, MoreVertical, Wallet, Pencil, ShieldCheck, Trash2, UserMinus, UserPlus, UserCheck } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import type { Member } from "@/lib/data/types";
import { removeMember, updateMember } from "@/lib/data/api";
import { PageHeader } from "@/components/app/PageHeader";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { BalanceAmount } from "@/components/app/BalanceAmount";
import { MemberDialog } from "@/components/members/MemberDialog";
import { InviteCard } from "@/components/members/InviteCard";
import { PinDialog } from "@/components/members/PinDialog";
import { PaymentDetailsDialog } from "@/components/payments/PaymentDetailsDialog";
import { PayDialog } from "@/components/payments/PayDialog";
import { useQuery } from "@tanstack/react-query";
import { listPinMembers } from "@/lib/pin/member-pin.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDate } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/_shell/members")({
  head: () => ({ meta: [{ title: "Members — Family Expense Tracker" }, { name: "description", content: "Who's in your household and how much each person has contributed." }] }),
  component: MembersPage,
});

function MembersPage() {
  const { members, balances, fmt, me, isAdmin, refresh, expenses, group } = useGroup();
  const [pinFor, setPinFor] = useState<Member | null>(null);
  const [payInfoFor, setPayInfoFor] = useState<Member | null>(null);
  const [payTo, setPayTo] = useState<Member | null>(null);
  const pins = useQuery({
    queryKey: ["pin-members", group.id],
    queryFn: () => listPinMembers({ data: { groupId: group.id } }),
    enabled: isAdmin,
  });
  const hasPin = new Set(pins.data ?? []);
  const [editing, setEditing] = useState<Member | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  const sorted = [...members].sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1));

  async function quick(m: Member, patch: Parameters<typeof updateMember>[1], msg: string) {
    try {
      await updateMember(m.id, patch);
      await refresh();
      toast.success(msg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update");
    }
  }

  async function remove() {
    if (!removing) return;
    try {
      await removeMember(removing.id);
      await refresh();
      toast.success(`${removing.name} removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove");
    } finally {
      setRemoving(null);
    }
  }

  const removingHasHistory = removing
    ? expenses.some((e) => e.paid_by === removing.id || e.participants.some((p) => p.member_id === removing.id))
    : false;

  return (
    <div>
      <PageHeader
        title="Members"
        description={`${members.filter((m) => m.status === "active").length} active members`}
        actions={isAdmin && <Button onClick={() => setAdding(true)}><UserPlus /> Add member</Button>}
      />
      {isAdmin && <InviteCard />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.map((m) => {
          const b = balances.get(m.id);
          return (
            <div key={m.id} className={`card-surface p-5 fade-up ${m.status === "inactive" ? "opacity-70" : ""}`}>
              <div className="flex items-start gap-3">
                <MemberAvatar name={m.name} seed={m.id} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold">{m.name}{m.id === me?.id && <span className="text-sm font-semibold text-muted-foreground"> (you)</span>}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.email ?? "No email"}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant={m.role === "admin" ? "purple" : "info"}>{m.role === "admin" ? "Admin" : "Member"}</Badge>
                    {m.status === "inactive" && <Badge variant="muted">Inactive</Badge>}
                    {hasPin.has(m.id) ? <Badge variant="success">PIN set</Badge> : m.user_id ? <Badge variant="success">Signed in</Badge> : m.email ? <Badge variant="warning">Invited</Badge> : <Badge variant="muted">No account</Badge>}
                  </div>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.name}`}><MoreVertical /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => setEditing(m)}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setPayInfoFor(m)}><Wallet className="h-4 w-4" /> eSewa details</DropdownMenuItem>
                      {(!m.user_id || hasPin.has(m.id)) && (
                        <DropdownMenuItem onSelect={() => setPinFor(m)}><KeyRound className="h-4 w-4" /> {hasPin.has(m.id) ? "Change PIN" : "Set PIN"}</DropdownMenuItem>
                      )}
                      <DropdownMenuItem onSelect={() => quick(m, { role: m.role === "admin" ? "member" : "admin" }, "Role updated")}>
                        <ShieldCheck className="h-4 w-4" /> {m.role === "admin" ? "Make member" : "Make admin"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => quick(m, { status: m.status === "active" ? "inactive" : "active" }, "Status updated")}>
                        {m.status === "active" ? <><UserMinus className="h-4 w-4" /> Mark inactive</> : <><UserCheck className="h-4 w-4" /> Mark active</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onSelect={() => setRemoving(m)}><Trash2 className="h-4 w-4" /> Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center">
                <div>
                  <dt className="text-[11px] font-semibold text-muted-foreground">Paid</dt>
                  <dd className="tabular text-sm font-bold">{fmt(b?.paid ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-muted-foreground">Share</dt>
                  <dd className="tabular text-sm font-bold">{fmt(b?.share ?? 0)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold text-muted-foreground">Balance</dt>
                  <dd><BalanceAmount minor={b?.net ?? 0} className="text-sm" /></dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2 text-sm">
                  <Wallet className="h-4 w-4 shrink-0 text-primary" />
                  {m.esewa_phone || m.esewa_qr_path ? (
                    <span className="truncate"><span className="text-muted-foreground">eSewa </span><span className="tabular font-semibold">{m.esewa_phone ?? "QR only"}</span></span>
                  ) : (
                    <span className="text-muted-foreground">No eSewa details</span>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {(m.esewa_phone || m.esewa_qr_path) && m.id !== me?.id && (
                    <Button size="sm" variant="soft" onClick={() => setPayTo(m)}>Pay</Button>
                  )}
                  {m.id === me?.id && (
                    <Button size="sm" variant="ghost" onClick={() => setPayInfoFor(m)}>{m.esewa_phone || m.esewa_qr_path ? "Edit" : "Add"}</Button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Joined {formatDate(m.joined_at)}</p>
            </div>
          );
        })}
      </div>

      <PaymentDetailsDialog member={payInfoFor} onClose={() => setPayInfoFor(null)} />
      <PayDialog receiver={payTo} onClose={() => setPayTo(null)} />
      <PinDialog member={pinFor} onClose={() => setPinFor(null)} onSaved={() => { void pins.refetch(); void refresh(); }} />
      <MemberDialog open={adding || !!editing} onOpenChange={(v) => { if (!v) { setAdding(false); setEditing(null); } }} member={editing} />

      <AlertDialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingHasHistory
                ? "This person is part of past expenses, so they can't be removed. Mark them inactive instead to keep the history correct."
                : "They'll no longer see this group. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {removingHasHistory ? (
              <AlertDialogAction onClick={() => removing && quick(removing, { status: "inactive" }, "Marked inactive")}>Mark inactive</AlertDialogAction>
            ) : (
              <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
