import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, Handshake, LayoutDashboard, Moon, PlusCircle, Receipt, Scale, Search, Settings, Users } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useGroup } from "@/hooks/use-group";
import { useTheme } from "@/hooks/use-theme";
import { CategoryIcon } from "@/components/expenses/CategoryBadge";

const PAGES = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/members", label: "Members", icon: Users },
  { to: "/balances", label: "Balances", icon: Scale },
  { to: "/settlements", label: "Settlements", icon: Handshake },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const { expenses, can, fmt } = useGroup();
  const { toggle, theme } = useTheme();

  function go(fn: () => void) {
    onOpenChange(false);
    fn();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Quick search</DialogTitle>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:gap-3 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5">
          <CommandInput placeholder="Search pages, actions or expenses…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>Nothing found.</CommandEmpty>
            <CommandGroup heading="Quick actions">
              {can.addExpense && (
                <CommandItem onSelect={() => go(() => navigate({ to: "/expenses/new" }))}>
                  <PlusCircle className="h-4 w-4 text-primary" /> Add an expense
                  <CommandShortcut>N</CommandShortcut>
                </CommandItem>
              )}
              <CommandItem onSelect={() => go(toggle)}>
                <Moon className="h-4 w-4 text-primary" /> Switch to {theme === "dark" ? "light" : "dark"} theme
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              {PAGES.map((p) => (
                <CommandItem key={p.to} onSelect={() => go(() => navigate({ to: p.to }))}>
                  <p.icon className="h-4 w-4 text-muted-foreground" /> {p.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {expenses.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Recent expenses">
                  {expenses.slice(0, 12).map((e) => (
                    <CommandItem key={e.id} value={`${e.title} ${e.notes ?? ""} ${e.id}`} onSelect={() => go(() => navigate({ to: "/expenses", search: { q: e.title } }))}>
                      <CategoryIcon category={e.category} size="sm" />
                      <span className="flex-1 truncate">{e.title}</span>
                      <span className="tabular text-xs text-muted-foreground">{fmt(e.amount_minor)}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function CommandTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group hidden h-10 max-w-md flex-1 items-center gap-2 rounded-xl border border-transparent bg-muted px-3 text-sm text-muted-foreground transition-all hover:border-border hover:bg-card hover:shadow-card sm:flex"
      aria-label="Open quick search"
    >
      <Search className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="flex-1 text-left">Search or jump to…</span>
      <kbd className="rounded-md border bg-card px-1.5 py-0.5 font-mono text-[11px] font-medium">Ctrl K</kbd>
    </button>
  );
}
