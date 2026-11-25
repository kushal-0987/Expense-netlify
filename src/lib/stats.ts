import { format, parseISO, startOfMonth, subMonths } from "date-fns";
import type { Expense } from "./data/types";
import { inRange } from "./dates";
import { getCategory } from "./categories";

type Range = { from: string | null; to: string | null };

export function filterByRange(expenses: Expense[], range: Range) {
  return expenses.filter((e) => inRange(e.expense_date, range));
}

export function total(expenses: Expense[]) {
  return expenses.reduce((a, e) => a + e.amount_minor, 0);
}

export function shareOf(expenses: Expense[], memberId: string) {
  let s = 0;
  for (const e of expenses) for (const p of e.participants) if (p.member_id === memberId) s += p.share_minor;
  return s;
}

/** Totals for the last `months` calendar months, oldest first. */
export function monthlyTotals(expenses: Expense[], months = 6, now = new Date()) {
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = startOfMonth(subMonths(now, months - 1 - i));
    return { key: format(d, "yyyy-MM"), label: format(d, "MMM"), total: 0 };
  });
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const e of expenses) {
    const i = index.get(e.expense_date.slice(0, 7));
    if (i !== undefined) buckets[i].total += e.amount_minor;
  }
  return buckets;
}

/** Daily totals for a list (used for short ranges). */
export function dailyTotals(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.expense_date, (map.get(e.expense_date) ?? 0) + e.amount_minor);
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, t]) => ({ key: date, label: format(parseISO(date), "MMM d"), total: t }));
}

export function categoryTotals(expenses: Expense[]) {
  const map = new Map<string, number>();
  for (const e of expenses) map.set(e.category, (map.get(e.category) ?? 0) + e.amount_minor);
  const sum = total(expenses) || 1;
  return [...map.entries()]
    .map(([cat, t]) => {
      const c = getCategory(cat);
      return { category: cat, label: c.label, color: c.color, total: t, share: t / sum };
    })
    .sort((a, b) => b.total - a.total);
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
