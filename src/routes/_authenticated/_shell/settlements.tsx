import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, Handshake, Plus, Trash2 } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import type { Settlement } from "@/lib/data/types";
import { completeSettlement, deleteSettlement } from "@/lib/data/api";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { SettlementDialog } from "@/components/settlements/SettlementDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/dates";

export const Route = createFileRoute("/_authenticated/_shell/settlements")({
  head: () => ({ meta: [{ title: "Settlements — Family Expense Tracker" }, { name: "description", content: "Payments made between members to settle balances." }] }),
  component: SettlementsPage,
});

type Filter = "all" | "pending" | "completed";

function SettlementsPage() {
  const { settlements, memberName, fmt, can, refresh } = useGroup();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const list = settlements.filter((s) => filter === "all" || s.status === filter);
  const pendingCount = settlements.filter((s) => s.status === "pending").length;

  async function act(s: Settlement, kind: "complete" | "delete") {
    setBusy(s.id);
    try {
      if (kind === "complete") await completeSettlement(s.id);
      else await deleteSettlement(s.id);
      await refresh();
      toast.success(kind === "complete" ? "Payment confirmed" : "Settlement deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Settlements"
        description="Money paid back between members."
        actions={can.recordSettlement && <Button onClick={() => setOpen(true)}><Plus /> Record settlement</Button>}
      />
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending{pendingCount ? ` (${pendingCount})` : ""}</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="card-surface">
        {list.length === 0 ? (
          <EmptyState icon={Handshake} title={filter === "pending" ? "No pending settlements" : "No settlements yet"} body="When someone pays another member back, record it here to update balances." />
        ) : (
          <ul className="divide-y">
            {list.map((s) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex -space-x-2">
                    <MemberAvatar name={memberName(s.payer_member_id)} seed={s.payer_member_id} size="sm" className="ring-2 ring-card" />
                    <MemberAvatar name={memberName(s.receiver_member_id)} seed={s.receiver_member_id} size="sm" className="ring-2 ring-card" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
                      {memberName(s.payer_member_id)} <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" /> {memberName(s.receiver_member_id)}
                    </div>
                    <div className="text-xs text-muted-foreground">{formatDate(s.settlement_date)}{s.notes && ` · ${s.notes}`}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={s.status === "completed" ? "success" : "warning"}>{s.status === "completed" ? "Completed" : "Pending"}</Badge>
                  <span className="tabular w-32 text-right text-base font-semibold">{fmt(s.amount_minor)}</span>
                  {can.completeSettlement(s) && (
                    <Button size="sm" variant="success" disabled={busy === s.id} onClick={() => act(s, "complete")}><Check /> Confirm</Button>
                  )}
                  {can.deleteSettlement(s) && (
                    <Button size="icon-sm" variant="ghost" disabled={busy === s.id} onClick={() => act(s, "delete")} aria-label="Delete settlement"><Trash2 /></Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SettlementDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
