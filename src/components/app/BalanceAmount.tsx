import { useGroup } from "@/hooks/use-group";
import { cn } from "@/lib/utils";

/** Positive = gets money back (green), negative = owes (red), zero = settled. */
export function BalanceAmount({ minor, className, showLabel = false }: { minor: number; className?: string; showLabel?: boolean }) {
  const { fmt } = useGroup();
  const tone = minor > 0 ? "text-success" : minor < 0 ? "text-destructive" : "text-muted-foreground";
  return (
    <span className={cn("tabular font-bold", tone, className)}>
      {minor > 0 ? "+" : ""}
      {fmt(minor)}
      {showLabel && (
        <span className="ml-1.5 text-xs font-semibold">
          {minor > 0 ? "gets back" : minor < 0 ? "owes" : "settled"}
        </span>
      )}
    </span>
  );
}
