import {
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subMonths,
} from "date-fns";

export const WEEK_STARTS_ON = 0 as const; // Sunday, as in Nepal

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function nowTime(): string {
  return format(new Date(), "HH:mm");
}

export function formatDate(iso: string, pattern = "MMM d, yyyy"): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m);
  return format(d, "h:mm a");
}

export type RangePreset = "all" | "this_week" | "this_month" | "last_month" | "this_year" | "custom";

export const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

/** Inclusive ISO date range for a preset. `null` bounds mean unbounded. */
export function presetRange(
  preset: RangePreset,
  now = new Date(),
  custom?: { from?: string; to?: string },
): { from: string | null; to: string | null } {
  switch (preset) {
    case "this_week":
      return {
        from: toISODate(startOfWeek(now, { weekStartsOn: WEEK_STARTS_ON })),
        to: toISODate(endOfWeek(now, { weekStartsOn: WEEK_STARTS_ON })),
      };
    case "this_month":
      return { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) };
    case "last_month": {
      const lm = subMonths(now, 1);
      return { from: toISODate(startOfMonth(lm)), to: toISODate(endOfMonth(lm)) };
    }
    case "this_year":
      return { from: toISODate(startOfYear(now)), to: toISODate(endOfYear(now)) };
    case "custom":
      return { from: custom?.from || null, to: custom?.to || null };
    default:
      return { from: null, to: null };
  }
}

export function inRange(iso: string, range: { from: string | null; to: string | null }) {
  if (range.from && iso < range.from) return false;
  if (range.to && iso > range.to) return false;
  return true;
}
