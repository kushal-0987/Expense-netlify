import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, BarChart3, Clock, Handshake, LineChart, Plus, Receipt, Sparkles, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import { StatCard, spotlight } from "@/components/app/StatCard";
import { AnimatedNumber } from "@/components/app/AnimatedNumber";
import { EmptyState } from "@/components/app/EmptyState";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { BalanceAmount } from "@/components/app/BalanceAmount";
import { CategoryDonut, SpendingBarChart } from "@/components/app/charts";
import { CategoryIcon } from "@/components/expenses/CategoryBadge";
import { ExpenseDetailDialog } from "@/components/expenses/ExpenseDetailDialog";
import { SettlementDialog, type SettlementPrefill } from "@/components/settlements/SettlementDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { presetRange, formatDate } from "@/lib/dates";
import { categoryTotals, filterByRange, monthlyTotals, percentChange, shareOf, total } from "@/lib/stats";
import { simplifyDebts } from "@/lib/finance/balances";
import type { Expense } from "@/lib/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Family Expense Tracker" },
      { name: "description", content: "Your household spending, balances and trends at a glance." },
      { property: "og:title", content: "Dashboard — Family Expense Tracker" },
      { property: "og:description", content: "Your household spending, balances and trends at a glance." },
    ],
  }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: typeof BarChart3 }[] }) {
  const idx = options.findIndex((o) => o.value === value);
  return (
    <div className="relative inline-flex rounded-lg bg-muted p-0.5 text-xs font-medium" role="tablist">
      <span
        aria-hidden
        className="absolute inset-y-0.5 rounded-md bg-card shadow-card transition-all duration-300 ease-out"
        style={{ width: `calc((100% - 4px) / ${options.length})`, left: `calc(2px + ${idx} * (100% - 4px) / ${options.length})` }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn("relative z-10 flex min-w-14 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 transition-colors", o.value === value ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          {o.icon && <o.icon className="h-3.5 w-3.5" />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Dashboard() {
  const g = useGroup();
  const { expenses, settlements, members, balances, me, fmt, memberName, can, group } = g;
  const [detail, setDetail] = useState<Expense | null>(null);
  const [settle, setSettle] = useState<SettlementPrefill | null>(null);
  const [chartType, setChartType] = useState<"bar" | "area">("bar");
  const [months, setMonths] = useState<"6" | "12">("6");
  const [activeCat, setActiveCat] = useState<number | null>(null);

  const stats = useMemo(() => {
    const thisMonth = filterByRange(expenses, presetRange("this_month"));
    const lastMonth = filterByRange(expenses, presetRange("last_month"));
    const t = total(thisMonth);
    const lt = total(lastMonth);
    const pending = settlements.filter((s) => s.status === "pending");
    const monthly6 = monthlyTotals(expenses, 6);
    const shareTrend = monthly6.map((m) => {
      const inMonth = expenses.filter((e) => e.expense_date.slice(0, 7) === m.key);
      return me ? shareOf(inMonth, me.id) : 0;
    });
    return {
      thisMonth,
      total: t,
      change: percentChange(t, lt),
      myShare: me ? shareOf(thisMonth, me.id) : 0,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((a, s) => a + s.amount_minor, 0),
      monthly: monthlyTotals(expenses, Number(months)),
      trend: monthly6.map((m) => m.total),
      shareTrend,
      categories: categoryTotals(thisMonth),
      avgPerExpense: thisMonth.length ? Math.round(t / thisMonth.length) : 0,
    };
  }, [expenses, settlements, me, months]);

  const myNet = me ? balances.get(me.id)?.net ?? 0 : 0;
  const memberRows = members
    .filter((m) => m.status === "active" || (balances.get(m.id)?.net ?? 0) !== 0)
    .map((m) => ({ m, b: balances.get(m.id)! }))
    .filter((r) => r.b)
    .sort((a, b) => b.b.net - a.b.net);
  const maxAbsNet = Math.max(1, ...memberRows.map((r) => Math.abs(r.b.net)));

  const suggestions = useMemo(() => {
    try {
      return simplifyDebts([...balances.values()].map((b) => ({ memberId: b.memberId, net: b.net })));
    } catch {
      return [];
    }
  }, [balances]);

  const firstName = (me?.name ?? "").split(" ")[0];
  const topCat = stats.categories[0];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="hero-surface fade-up relative overflow-hidden rounded-3xl p-6 shadow-elevated sm:p-8">
        <div aria-hidden className="grid-pattern absolute inset-0" />
        <div aria-hidden className="float-slow absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary-glow/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-navy-foreground/15 bg-navy-foreground/5 px-3 py-1 text-xs font-medium text-navy-foreground/80 backdrop-blur">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" />
              {group.name} · live
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {greeting()}
              {firstName ? <>, <span className="shimmer-text">{firstName}</span></> : null}
            </h1>
            <p className="max-w-lg text-sm text-navy-foreground/70">
              {stats.thisMonth.length === 0
                ? "No spending recorded this month yet — add your first expense to see the numbers come alive."
                : <>Your household spent <span className="font-semibold text-navy-foreground">{fmt(stats.total)}</span> across {stats.thisMonth.length} {stats.thisMonth.length === 1 ? "expense" : "expenses"} this month{topCat ? <>, mostly on <span className="font-semibold text-navy-foreground">{topCat.label.toLowerCase()}</span></> : null}.</>}
            </p>
          </div>
          <div className="flex flex-col items-start gap-4 lg:items-end">
            <div className="lg:text-right">
              <div className="text-xs font-medium uppercase tracking-wider text-navy-foreground/60">Spent this month</div>
              <div className="tabular text-4xl font-semibold sm:text-5xl">
                <AnimatedNumber value={stats.total} format={(n) => fmt(n)} duration={1200} />
              </div>
              {stats.change !== null && (
                <div className={cn("mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", stats.change > 0 ? "bg-destructive/20 text-destructive-foreground" : "bg-success/25 text-success-foreground")}>
                  {stats.change > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(stats.change).toFixed(1)}% vs last month
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {can.recordSettlement && (
                <Button variant="outline" onClick={() => setSettle({})} className="border-navy-foreground/20 bg-navy-foreground/10 text-navy-foreground backdrop-blur hover:bg-navy-foreground/20 hover:text-navy-foreground">
                  <Handshake /> Settle up
                </Button>
              )}
              {can.addExpense && (
                <Button asChild className="bg-gradient-primary shadow-glow transition-transform hover:-translate-y-0.5">
                  <Link to="/expenses/new"><Plus /> Add expense</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Spent this month"
          icon={Wallet}
          amount={stats.total}
          format={(n) => fmt(n)}
          trend={stats.trend}
          delay={80}
          hint={
            stats.change === null ? "No spending last month" : (
              <span className={stats.change > 0 ? "text-destructive" : "text-success"}>
                {stats.change > 0 ? <TrendingUp className="mr-1 inline h-3.5 w-3.5" /> : <TrendingDown className="mr-1 inline h-3.5 w-3.5" />}
                {Math.abs(stats.change).toFixed(1)}% vs last month
              </span>
            )
          }
        />
        <StatCard label="Your share this month" icon={Receipt} tone="purple" amount={stats.myShare} format={(n) => fmt(n)} trend={stats.shareTrend} delay={160} hint={`${stats.thisMonth.length} ${stats.thisMonth.length === 1 ? "expense" : "expenses"} · avg ${fmt(stats.avgPerExpense)}`} />
        <StatCard
          label="Your balance"
          icon={myNet >= 0 ? TrendingUp : TrendingDown}
          tone={myNet > 0 ? "green" : myNet < 0 ? "red" : "blue"}
          amount={myNet}
          format={(n) => fmt(n)}
          delay={240}
          valueClassName={myNet > 0 ? "text-success" : myNet < 0 ? "text-destructive" : undefined}
          hint={myNet > 0 ? "Others owe you" : myNet < 0 ? "You owe the group" : "You're all settled"}
        />
        <StatCard label="Pending settlements" icon={Clock} tone="amber" amount={stats.pendingCount} delay={320} hint={stats.pendingCount ? `${fmt(stats.pendingAmount)} awaiting confirmation` : "Nothing waiting"} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="fade-up xl:col-span-2" style={{ ["--delay" as string]: "200ms" }}>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div>
              <CardTitle>Spending trend</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Total household spend per month</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented value={months} onChange={setMonths} options={[{ value: "6", label: "6M" }, { value: "12", label: "12M" }]} />
              <Segmented value={chartType} onChange={setChartType} options={[{ value: "bar", label: "Bars", icon: BarChart3 }, { value: "area", label: "Line", icon: LineChart }]} />
            </div>
          </CardHeader>
          <CardContent>
            <div key={`${chartType}-${months}`} className="animate-in fade-in duration-500">
              <SpendingBarChart data={stats.monthly} variant={chartType} />
            </div>
          </CardContent>
        </Card>
        <Card className="fade-up" style={{ ["--delay" as string]: "280ms" }}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>By category</CardTitle>
            <Button variant="link" size="sm" asChild className="px-0">
              <Link to="/reports">Reports <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {stats.categories.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No spending yet this month.</p>
            ) : (
              <>
                <CategoryDonut data={stats.categories} height={190} activeIndex={activeCat} onActiveChange={setActiveCat} />
                <ul className="mt-4 space-y-1">
                  {stats.categories.slice(0, 5).map((c, i) => (
                    <li
                      key={c.category}
                      onMouseEnter={() => setActiveCat(i)}
                      onMouseLeave={() => setActiveCat(null)}
                      className={cn("cursor-default rounded-lg px-2 py-1.5 text-sm transition-colors", activeCat === i && "bg-muted")}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="flex-1">{c.label}</span>
                        <span className="text-xs text-muted-foreground">{Math.round(c.share * 100)}%</span>
                        <span className="tabular w-28 text-right text-[13px] font-medium">{fmt(c.total)}</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted">
                        <div className="grow-x h-full rounded-full" style={{ width: `${Math.max(3, c.share * 100)}%`, backgroundColor: c.color, ["--delay" as string]: `${300 + i * 90}ms` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity */}
      <div className="grid gap-6 xl:grid-cols-3 xl:items-start">
        <Card className="fade-up xl:col-span-2" style={{ ["--delay" as string]: "320ms" }}>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recent expenses</CardTitle>
            <Button variant="link" size="sm" asChild className="px-0">
              <Link to="/expenses">View all <ArrowRight /></Link>
            </Button>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {expenses.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No expenses yet"
                body="Add your first shared expense — rent, groceries or a dinner out."
                action={can.addExpense ? <Button asChild><Link to="/expenses/new"><Plus /> Add expense</Link></Button> : undefined}
              />
            ) : (
              <ul className="space-y-1">
                {expenses.slice(0, 6).map((e, i) => (
                  <li key={e.id} className="fade-up" style={{ ["--delay" as string]: `${380 + i * 60}ms` }}>
                    <button className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-all duration-200 hover:translate-x-1 hover:bg-muted" onClick={() => setDetail(e)}>
                      <span className="transition-transform duration-300 group-hover:scale-110"><CategoryIcon category={e.category} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{e.title}</div>
                        <div className="text-xs text-muted-foreground">{memberName(e.paid_by)} paid · {formatDate(e.expense_date)}</div>
                      </div>
                      <div className="tabular text-sm font-semibold">{fmt(e.amount_minor)}</div>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="fade-up" style={{ ["--delay" as string]: "380ms" }}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Member balances</CardTitle>
              <Button variant="link" size="sm" asChild className="px-0">
                <Link to="/balances">Details <ArrowRight /></Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {memberRows.map(({ m, b }, i) => (
                  <li key={m.id} className="group">
                    <div className="flex items-center gap-3">
                      <MemberAvatar name={m.name} seed={m.id} size="sm" className="transition-transform group-hover:scale-110" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">{m.name}{m.id === me?.id && <span className="font-normal text-muted-foreground"> (you)</span>}</div>
                        <div className="text-xs text-muted-foreground">Paid {fmt(b.paid)}</div>
                      </div>
                      <BalanceAmount minor={b.net} className="text-sm font-semibold" />
                    </div>
                    <div className="ml-11 mt-2 h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("grow-x h-full rounded-full", b.net > 0 ? "bg-success" : b.net < 0 ? "bg-destructive" : "bg-muted-foreground/30")}
                        style={{ width: `${Math.max(4, (Math.abs(b.net) / maxAbsNet) * 100)}%`, ["--delay" as string]: `${450 + i * 80}ms` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="fade-up" style={{ ["--delay" as string]: "440ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Suggested settlements</CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Everyone is settled up.</p>
              ) : (
                <ul className="space-y-2.5">
                  {suggestions.slice(0, 4).map((t) => (
                    <li key={`${t.from}-${t.to}`} onMouseMove={spotlight} className="interactive-card flex items-center gap-2 rounded-xl border p-3">
                      <div className="flex -space-x-2">
                        <MemberAvatar name={memberName(t.from)} seed={t.from} size="xs" className="ring-2 ring-card" />
                        <MemberAvatar name={memberName(t.to)} seed={t.to} size="xs" className="ring-2 ring-card" />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <span className="font-semibold">{memberName(t.from)}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="font-semibold">{memberName(t.to)}</span>
                        <div className="tabular font-semibold text-primary">{fmt(t.amount)}</div>
                      </div>
                      {can.recordSettlementBetween(t.from, t.to) && (
                        <Button size="sm" variant="soft" onClick={() => setSettle({ payer: t.from, receiver: t.to, amountMinor: t.amount })}>
                          Settle
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ExpenseDetailDialog expense={detail} onOpenChange={(v) => !v && setDetail(null)} />
      <SettlementDialog open={!!settle} onOpenChange={(v) => !v && setSettle(null)} prefill={settle ?? undefined} />
    </div>
  );
}
