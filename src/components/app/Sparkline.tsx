import { useId } from "react";

/** Tiny animated trend line. Values are plotted oldest → newest. */
export function Sparkline({ values, className, color = "var(--primary)" }: { values: number[]; className?: string; color?: string }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return null;
  const w = 100;
  const h = 32;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1]!;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} className="animate-in fade-in duration-1000" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "spark-draw 1.2s cubic-bezier(0.2,0.8,0.2,1) 0.2s forwards" }}
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} className="animate-in fade-in zoom-in duration-500" style={{ animationDelay: "1.2s", animationFillMode: "both" }} />
    </svg>
  );
}
