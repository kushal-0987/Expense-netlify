import { getCategory } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryIcon({ category, size = "md" }: { category: string; size?: "sm" | "md" }) {
  const c = getCategory(category);
  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-xl", dims)}
      style={{ backgroundColor: `color-mix(in oklab, ${c.color} 14%, transparent)`, color: c.color }}
    >
      <c.icon className={size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]"} />
    </span>
  );
}

export function CategoryBadge({ category }: { category: string }) {
  const c = getCategory(category);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `color-mix(in oklab, ${c.color} 12%, transparent)`, color: c.color }}
    >
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
