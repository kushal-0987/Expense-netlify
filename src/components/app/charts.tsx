import { useId, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip, XAxis, YAxis } from "recharts";
import { useGroup } from "@/hooks/use-group";

const axis = { fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" };

function compactMajor(minor: number) {
  const v = minor / 100;
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
  return String(Math.round(v));
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string; payload?: { fill?: string } }[]; label?: string }) {
  const { fmt } = useGroup();
  if (!active || !payload?.length) return null;
  return (
    <div className="animate-in fade-in zoom-in-95 rounded-xl border bg-popover/95 px-3 py-2 text-xs shadow-elevated backdrop-blur duration-150">
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.payload?.fill ?? p.color }} />
          {p.name && <span className="text-muted-foreground">{p.name}</span>}
          <span className="tabular ml-auto font-semibold">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingBarChart({ data, height = 260, variant = "bar" }: { data: { label: string; total: number }[]; height?: number; variant?: "bar" | "area" }) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const grid = <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />;
  const x = <XAxis dataKey="label" tickLine={false} axisLine={false} tick={axis} dy={6} />;
  const y = <YAxis tickLine={false} axisLine={false} tick={axis} tickFormatter={compactMajor} width={48} />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      {variant === "area" ? (
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id={`area-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          {grid}
          {x}
          {y}
          <Tooltip cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4" }} content={<ChartTooltip />} />
          <Area type="monotone" dataKey="total" name="Spent" stroke="var(--primary)" strokeWidth={2.5} fill={`url(#area-${id})`} animationDuration={1100} activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }} />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }} onMouseLeave={() => setHover(null)}>
          <defs>
            <linearGradient id={`bar-${id}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary-glow)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
          </defs>
          {grid}
          {x}
          {y}
          <Tooltip cursor={{ fill: "var(--muted)", radius: 8 }} content={<ChartTooltip />} />
          <Bar dataKey="total" name="Spent" radius={[8, 8, 3, 3]} maxBarSize={44} animationDuration={900} onMouseEnter={(_, i) => setHover(i)}>
            {data.map((d, i) => (
              <Cell key={d.label} fill={`url(#bar-${id})`} fillOpacity={hover === null || hover === i ? 1 : 0.35} style={{ transition: "fill-opacity 0.25s ease" }} />
            ))}
          </Bar>
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

export function PaidVsShareChart({ data, height = 280 }: { data: { name: string; paid: number; share: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={axis} dy={6} />
        <YAxis tickLine={false} axisLine={false} tick={axis} tickFormatter={compactMajor} width={48} />
        <Tooltip cursor={{ fill: "var(--muted)", radius: 8 }} content={<ChartTooltip />} />
        <Bar dataKey="paid" name="Paid" fill="var(--primary)" radius={[6, 6, 2, 2]} maxBarSize={28} animationDuration={900} />
        <Bar dataKey="share" name="Share" fill="var(--purple)" radius={[6, 6, 2, 2]} maxBarSize={28} animationDuration={900} animationBegin={150} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type SectorShape = { cx: number; cy: number; innerRadius: number; outerRadius: number; startAngle: number; endAngle: number; fill: string };

function ActiveSlice(props: unknown) {
  const p = props as SectorShape;
  return (
    <g>
      <Sector {...p} outerRadius={p.outerRadius + 6} cornerRadius={4} />
      <Sector {...p} innerRadius={p.outerRadius + 9} outerRadius={p.outerRadius + 11} cornerRadius={2} />
    </g>
  );
}

export function CategoryDonut({
  data,
  height = 220,
  activeIndex,
  onActiveChange,
}: {
  data: { label: string; total: number; color: string }[];
  height?: number;
  activeIndex?: number | null;
  onActiveChange?: (i: number | null) => void;
}) {
  const { fmt } = useGroup();
  const [localActive, setLocalActive] = useState<number | null>(null);
  const active = activeIndex !== undefined ? activeIndex : localActive;
  const setActive = onActiveChange ?? setLocalActive;
  const sum = data.reduce((a, d) => a + d.total, 0);
  const focus = active !== null ? data[active] : undefined;

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="label"
            innerRadius="64%"
            outerRadius="86%"
            paddingAngle={2}
            cornerRadius={4}
            stroke="none"
            activeIndex={active ?? undefined}
            activeShape={ActiveSlice}
            onMouseEnter={(_, i) => setActive(i)}
            onMouseLeave={() => setActive(null)}
            animationDuration={1000}
          >
            {data.map((d) => (
              <Cell key={d.label} fill={d.color} className="cursor-pointer outline-none" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <div key={focus?.label ?? "all"} className="animate-in fade-in zoom-in-95 duration-200">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{focus?.label ?? "Total"}</div>
          <div className="tabular text-base font-semibold">{fmt(focus?.total ?? sum)}</div>
          {focus && sum > 0 && <div className="text-[11px] text-muted-foreground">{Math.round((focus.total / sum) * 100)}% of spend</div>}
        </div>
      </div>
    </div>
  );
}
