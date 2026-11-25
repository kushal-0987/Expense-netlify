/**
 * All money is handled as integer minor units (paisa). 1 rupee = 100 paisa.
 * Never do financial math on floating point rupee values.
 */

export type CurrencyCode = "NPR" | "INR" | "USD" | "EUR" | "GBP";

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "NPR", label: "Nepalese Rupee (Rs.)", symbol: "Rs." },
  { code: "INR", label: "Indian Rupee (₹)", symbol: "₹" },
  { code: "USD", label: "US Dollar ($)", symbol: "$" },
  { code: "EUR", label: "Euro (€)", symbol: "€" },
  { code: "GBP", label: "British Pound (£)", symbol: "£" },
];

export function currencySymbol(code: string | null | undefined): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? "Rs.";
}

const groupFormatter = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function assertInt(minor: number) {
  if (!Number.isSafeInteger(minor)) throw new Error(`Invalid minor amount: ${minor}`);
}

/** 3584400 -> "Rs. 35,844.00" */
export function formatMoney(
  minor: number,
  currency: string = "NPR",
  opts: { signed?: boolean; compact?: boolean } = {},
): string {
  assertInt(minor);
  const negative = minor < 0;
  const abs = Math.abs(minor);
  const major = Math.trunc(abs / 100);
  const fraction = abs % 100;
  const symbol = currencySymbol(currency);
  let body: string;
  if (opts.compact && major >= 100000) {
    // 1,25,000 -> 1.25L ; 1,00,00,000 -> 1Cr
    if (major >= 10000000) body = `${trimZeros((major / 10000000).toFixed(2))}Cr`;
    else body = `${trimZeros((major / 100000).toFixed(2))}L`;
  } else {
    body = `${groupFormatter.format(major)}.${String(fraction).padStart(2, "0")}`;
  }
  const sign = negative ? "-" : opts.signed && minor > 0 ? "+" : "";
  return `${sign}${symbol} ${body}`;
}

function trimZeros(s: string) {
  return s.replace(/\.?0+$/, "");
}

/** Minor units -> plain editable string, e.g. 123450 -> "1234.50" */
export function minorToInput(minor: number): string {
  assertInt(minor);
  const neg = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  return `${neg}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/**
 * Parse a user-entered amount ("1,234.5", "Rs. 300") into minor units using
 * string arithmetic only. Returns null when the value is not a valid amount.
 */
export function parseMoney(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  let s = String(input).trim().replace(/^(rs\.?|npr|₨|₹|\$|€|£)\s*/i, "").replace(/,/g, "").trim();
  if (s === "") return null;
  const m = /^(\d+)(?:\.(\d{0,2}))?$/.exec(s);
  if (!m) return null;
  const major = m[1].replace(/^0+(?=\d)/, "");
  const frac = (m[2] ?? "").padEnd(2, "0");
  if (major.length > 12) return null;
  const value = Number(major) * 100 + Number(frac);
  return Number.isSafeInteger(value) ? value : null;
}

/** "33.33" -> 3333 basis points (hundredths of a percent). */
export function parsePercent(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const s = String(input).trim().replace(/%$/, "").trim();
  if (s === "") return null;
  const m = /^(\d{1,3})(?:\.(\d{0,2}))?$/.exec(s);
  if (!m) return null;
  const bps = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0"));
  return bps <= 10000 ? bps : null;
}

export function formatPercent(bps: number): string {
  return `${trimZeros((bps / 100).toFixed(2))}%`;
}

/**
 * Split a total equally between n people. Leftover paisa go one each to the
 * first participants, so shares differ by at most 1 paisa and always sum to total.
 */
export function splitEqual(total: number, n: number): number[] {
  assertInt(total);
  if (n <= 0) return [];
  const base = Math.floor(total / n);
  const remainder = total - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < remainder ? 1 : 0));
}

/**
 * Split a total by percentages (basis points, must sum to 10000) using the
 * largest-remainder method. Shares always sum exactly to total.
 */
export function splitByPercentages(total: number, bps: number[]): number[] {
  assertInt(total);
  const sum = bps.reduce((a, b) => a + b, 0);
  if (sum !== 10000) throw new Error("Percentages must add up to 100%");
  const raw = bps.map((p) => total * p);
  const floors = raw.map((r) => Math.floor(r / 10000));
  let leftover = total - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, rem: r % 10000 }))
    .sort((a, b) => b.rem - a.rem || a.i - b.i);
  for (const { i } of order) {
    if (leftover <= 0) break;
    floors[i] += 1;
    leftover -= 1;
  }
  return floors;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}
