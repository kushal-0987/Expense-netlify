import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Receipt, Search, X } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/EmptyState";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { CategoryBadge, CategoryIcon } from "@/components/expenses/CategoryBadge";
import { ExpenseDetailDialog } from "@/components/expenses/ExpenseDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, getCategory } from "@/lib/categories";
import { RANGE_PRESETS, formatDate, formatTime, inRange, presetRange, type RangePreset } from "@/lib/dates";
import { total } from "@/lib/stats";
import { minorToInput } from "@/lib/finance/money";
import { downloadCsv } from "@/lib/csv";
import type { Expense } from "@/lib/data/types";

interface ExpenseSearch {
  q?: string | undefined;
  category?: string | undefined;
  member?: string | undefined;
  range?: RangePreset | undefined;
}

const PRESETS = RANGE_PRESETS.filter((p) => p.value !== "custom");
const PAGE_SIZE = 20;

export const Route = createFileRoute("/_authenticated/_shell/expenses/")({
  validateSearch: (s: Record<string, unknown>): ExpenseSearch => {
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);
    const range = str(s["range"]);
    return {
      q: str(s["q"]),
      category: str(s["category"]),
      member: str(s["member"]),
      range: PRESETS.some((p) => p.value === range) ? (range as RangePreset) : undefined,
    };
  },
  head: () => ({ meta: [{ title: "Expenses — Family Expense Tracker" }, { name: "description", content: "Search and filter every shared expense." }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { expenses, members, memberName, fmt, can, group } = useGroup();
  const [detail, setDetail] = useState<Expense | null>(null);
  const [q, setQ] = useState(search.q ?? "");
  const [page, setPage] = useState(1);

  useEffect(() => setQ(search.q ?? ""), [search.q]);
  useEffect(() => setPage(1), [search.q, search.category, search.member, search.range]);

  const setSearch = (patch: Partial<ExpenseSearch>) => navigate({ search: (prev) => ({ ...prev, ...patch }), replace: true });

  const filtered = useMemo(() => {
    const range = presetRange(search.range ?? "all");
    const needle = (search.q ?? "").toLowerCase();
    return expenses.filter((e) => {
      if (!inRange(e.expense_date, range)) return false;
      if (search.category && e.category !== search.category) return false;
      if (search.member && e.paid_by !== search.member && !e.participants.some((p) => p.member_id === search.member)) return false;
      if (needle) {
        const hay = `${e.title} ${e.description} ${e.notes} ${memberName(e.paid_by)} ${getCategory(e.category).label}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [expenses, search, memberName]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = !!(search.q || search.category || search.member || search.range);

  function exportCsv() {
    downloadCsv(`${group.name.replace(/\W+/g, "-").toLowerCase()}-expenses.csv`, [
      ["Date", "Time", "Title", "Category", "Paid by", "Amount", "Split", "Shares", "Notes"],
      ...filtered.map((e) => [
        e.expense_date,
        e.expense_time?.slice(0, 5) ?? "",
        e.title,
        getCategory(e.category).label,
        memberName(e.paid_by),
        minorToInput(e.amount_minor),
        e.split_method,
        e.participants.map((p) => `${memberName(p.member_id)}: ${minorToInput(p.share_minor)}`).join("; "),
        e.notes,
      ]),
    ]);
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={`${filtered.length} ${filtered.length === 1 ? "expense" : "expenses"} · ${fmt(total(filtered))}`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download /> Export CSV</Button>
            {can.addExpense && <Button asChild><Link to="/expenses/new"><Plus /> Add expense</Link></Button>}
          </>
        }
      />

      <div className="card-surface mb-4 grid gap-3 p-4 md:grid-cols-[1fr_repeat(3,11rem)_auto]">
        <form className="relative" onSubmit={(e) => { e.preventDefault(); setSearch({ q: q.trim() || undefined }); }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => setSearch({ q: q.trim() || undefined })} placeholder="Search title, notes, payer…" className="pl-9" aria-label="Search expenses" />
        </form>
        <Select value={search.category ?? "all"} onValueChange={(v) => setSearch({ category: v === "all" ? undefined : v })}>
          <SelectTrigger aria-label="Category"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={search.member ?? "all"} onValueChange={(v) => setSearch({ member: v === "all" ? undefined : v })}>
          <SelectTrigger aria-label="Member"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All members</SelectItem>
            {members.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={search.range ?? "all"} onValueChange={(v) => setSearch({ range: v === "all" ? undefined : (v as RangePreset) })}>
          <SelectTrigger aria-label="Date range"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PRESETS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" onClick={() => navigate({ search: {}, replace: true })}><X /> Clear</Button>
        )}
      </div>

      <div className="card-surface overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={hasFilters ? "No expenses match these filters" : "No expenses yet"}
            body={hasFilters ? "Try a different search or clear the filters." : "Add the first shared expense for your group."}
            action={!hasFilters && can.addExpense ? <Button asChild><Link to="/expenses/new"><Plus /> Add expense</Link></Button> : undefined}
          />
        ) : (
          <>
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/60 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Expense</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Paid by</th>
                    <th className="px-3 py-3">Split with</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {visible.map((e) => (
                    <tr key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setDetail(e)}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryIcon category={e.category} size="sm" />
                          <div className="min-w-0">
                            <div className="truncate font-bold">{e.title}</div>
                            {e.description && <div className="max-w-xs truncate text-xs text-muted-foreground">{e.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3"><CategoryBadge category={e.category} /></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2"><MemberAvatar name={memberName(e.paid_by)} seed={e.paid_by} size="xs" />{memberName(e.paid_by)}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex -space-x-1.5">
                          {e.participants.slice(0, 5).map((p) => (
                            <MemberAvatar key={p.id} name={memberName(p.member_id)} seed={p.member_id} size="xs" className="ring-2 ring-card" />
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{formatDate(e.expense_date)}<div className="text-xs">{formatTime(e.expense_time)}</div></td>
                      <td className="tabular px-5 py-3 text-right font-semibold">{fmt(e.amount_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y md:hidden">
              {visible.map((e) => (
                <li key={e.id}>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setDetail(e)}>
                    <CategoryIcon category={e.category} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold">{e.title}</div>
                      <div className="text-xs text-muted-foreground">{memberName(e.paid_by)} · {formatDate(e.expense_date)}</div>
                    </div>
                    <div className="tabular text-sm font-semibold">{fmt(e.amount_minor)}</div>
                  </button>
                </li>
              ))}
            </ul>
            {pages > 1 && (
              <div className="flex items-center justify-between border-t px-5 py-3 text-sm">
                <span className="text-muted-foreground">Page {page} of {pages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button size="sm" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ExpenseDetailDialog expense={detail} onOpenChange={(v) => !v && setDetail(null)} />
    </div>
  );
}
