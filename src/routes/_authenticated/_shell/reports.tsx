import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useGroup } from "@/hooks/use-group";
import { PageHeader } from "@/components/app/PageHeader";
import { CategoryDonut, PaidVsShareChart, SpendingBarChart } from "@/components/app/charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RANGE_PRESETS, presetRange, type RangePreset } from "@/lib/dates";
import { categoryTotals, dailyTotals, filterByRange, monthlyTotals, shareOf, total } from "@/lib/stats";

export const Route = createFileRoute("/_authenticated/_shell/reports")({
  head: () => ({ meta: [{ title: "Reports — Family Expense Tracker" }, { name: "description", content: "Spending trends, categories and contributions." }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { expenses, members, fmt } = useGroup();
  const [range, setRange] = useState<RangePreset>("this_month");
  const list = useMemo(() => filterByRange(expenses, presetRange(range)), [expenses, range]);
  const cats = categoryTotals(list);
  const trend = range === "this_week" || range === "this_month" || range === "last_month" ? dailyTotals(list) : monthlyTotals(expenses, 12);
  const people = members.map((m) => ({
    name: m.name,
    paid: list.filter((e) => e.paid_by === m.id).reduce((a, e) => a + e.amount_minor, 0),
    share: shareOf(list, m.id),
  }));

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description={`${list.length} expenses · ${fmt(total(list))}`}
        actions={
          <Select value={range} onValueChange={(v) => setRange(v as RangePreset)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_PRESETS.filter((p) => p.value !== "custom").map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle>Spending over time</CardTitle></CardHeader>
          <CardContent><SpendingBarChart data={trend} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By category</CardTitle></CardHeader>
          <CardContent>
            {cats.length === 0 ? <p className="py-16 text-center text-sm text-muted-foreground">No spending in this period.</p> : (
              <>
                <CategoryDonut data={cats} height={180} />
                <ul className="mt-4 space-y-2">
                  {cats.map((c) => (
                    <li key={c.category} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="flex-1">{c.label}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(c.share * 100)}%</span>
                      <span className="tabular w-28 text-right font-semibold">{fmt(c.total)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader><CardTitle>Paid vs share per member</CardTitle></CardHeader>
          <CardContent><PaidVsShareChart data={people} /></CardContent>
        </Card>
      </div>
    </div>
  );
}
