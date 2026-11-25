import type { LucideIcon } from "lucide-react";
import type { MouseEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AnimatedNumber } from "./AnimatedNumber";
import { Sparkline } from "./Sparkline";

const TONES = {
  blue: { chip: "bg-primary-soft text-primary", line: "var(--primary)" },
  green: { chip: "bg-success-soft text-success", line: "var(--success)" },
  red: { chip: "bg-destructive-soft text-destructive", line: "var(--destructive)" },
  purple: { chip: "bg-purple-soft text-purple", line: "var(--purple)" },
  amber: { chip: "bg-warning-soft text-warning", line: "var(--warning)" },
} as const;

/** Tracks the cursor so `.interactive-card` can paint its spotlight. */
export function spotlight(e: MouseEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
}

export function StatCard({
  label,
  value,
  amount,
  format,
  hint,
  icon: Icon,
  tone = "blue",
  valueClassName,
  trend,
  delay = 0,
}: {
  label: string;
  value?: ReactNode;
  /** Numeric value to animate; rendered with `format`. Overrides `value`. */
  amount?: number;
  format?: (n: number) => string;
  hint?: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  valueClassName?: string;
  trend?: number[];
  delay?: number;
}) {
  const t = TONES[tone];
  return (
    <div
      onMouseMove={spotlight}
      className="card-surface interactive-card group fade-up flex flex-col gap-3 p-5"
      style={{ ["--delay" as string]: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6", t.chip)}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className={cn("tabular whitespace-nowrap text-[1.65rem] font-semibold leading-none", valueClassName)}>
          {amount !== undefined ? <AnimatedNumber value={amount} format={format} /> : value}
        </div>
        {trend && trend.filter((v) => v !== 0).length >= 2 && <Sparkline values={trend} color={t.line} className="h-8 w-24 shrink-0 opacity-90" />}
      </div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
