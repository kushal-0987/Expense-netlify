import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow transition-transform duration-500 hover:rotate-[-8deg] hover:scale-105">
        <Wallet className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <div className={cn("text-sm font-semibold tracking-tight", tone === "light" ? "text-navy-foreground" : "text-foreground")}>
          Family Expense
        </div>
        <div className={cn("text-[10px] font-medium uppercase tracking-[0.2em]", tone === "light" ? "text-sidebar-foreground" : "text-muted-foreground")}>
          Tracker
        </div>
      </div>
    </div>
  );
}
