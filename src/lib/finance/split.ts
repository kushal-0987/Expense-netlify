import { formatPercent, parseMoney, parsePercent, splitByPercentages, splitEqual } from "./money";

export type SplitMethod = "equal" | "exact" | "percentage" | "individual";

export interface SplitRow {
  memberId: string;
  included: boolean;
  exact: string;
  percent: string;
}

export interface SplitResult {
  shares: { member_id: string; share_minor: number; percentage_bps: number | null }[];
  /** Amount still to assign (exact) or percentage basis points left (percentage). */
  remaining: number;
  error: string | null;
}

/**
 * Turn the form state into exact shares in minor units. Shares always sum to the
 * amount when `error` is null.
 */
export function computeShares(method: SplitMethod, amountMinor: number | null, rows: SplitRow[], individualId?: string): SplitResult {
  const amount = amountMinor ?? 0;
  if (!amount || amount <= 0) return { shares: [], remaining: 0, error: "Enter the amount first" };

  if (method === "individual") {
    if (!individualId) return { shares: [], remaining: amount, error: "Choose who this expense belongs to" };
    return { shares: [{ member_id: individualId, share_minor: amount, percentage_bps: null }], remaining: 0, error: null };
  }

  const included = rows.filter((r) => r.included);
  if (!included.length) return { shares: [], remaining: amount, error: "Choose at least one person to split with" };

  if (method === "equal") {
    const parts = splitEqual(amount, included.length);
    return {
      shares: included.map((r, i) => ({ member_id: r.memberId, share_minor: parts[i], percentage_bps: null })),
      remaining: 0,
      error: null,
    };
  }

  if (method === "exact") {
    const values = included.map((r) => (r.exact.trim() === "" ? 0 : parseMoney(r.exact)));
    if (values.some((v) => v === null)) return { shares: [], remaining: amount, error: "Check the amounts — use numbers like 250 or 250.50" };
    const sum = (values as number[]).reduce((a, b) => a + b, 0);
    const remaining = amount - sum;
    const shares = included.map((r, i) => ({ member_id: r.memberId, share_minor: values[i] as number, percentage_bps: null }));
    if (remaining !== 0) return { shares, remaining, error: remaining > 0 ? "Some of the amount is still unassigned" : "The shares add up to more than the amount" };
    return { shares, remaining: 0, error: null };
  }

  const bps = included.map((r) => (r.percent.trim() === "" ? 0 : parsePercent(r.percent)));
  if (bps.some((v) => v === null)) return { shares: [], remaining: 10000, error: "Percentages must be between 0 and 100" };
  const sumBps = (bps as number[]).reduce((a, b) => a + b, 0);
  if (sumBps !== 10000) {
    return { shares: [], remaining: 10000 - sumBps, error: `Percentages add up to ${formatPercent(sumBps)} — they must total 100%` };
  }
  const parts = splitByPercentages(amount, bps as number[]);
  return {
    shares: included.map((r, i) => ({ member_id: r.memberId, share_minor: parts[i], percentage_bps: bps[i] as number })),
    remaining: 0,
    error: null,
  };
}

/** Even percentages that total exactly 100%, e.g. 3 people -> 33.34 / 33.33 / 33.33. */
export function evenPercents(n: number): string[] {
  return splitEqual(10000, n).map((b) => (b / 100).toFixed(2));
}
