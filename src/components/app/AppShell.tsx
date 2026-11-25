import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  BarChart3,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Plus,
  Receipt,
  Scale,
  Search,
  Settings,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/hooks/use-group";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "./Logo";
import { GroupSwitcher } from "./GroupSwitcher";
import { NotificationsMenu } from "./NotificationsMenu";
import { MemberAvatar } from "./MemberAvatar";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette, CommandTrigger, useCommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/expenses/new", label: "Add Expense", icon: PlusCircle },
  { to: "/members", label: "Members", icon: Users },
  { to: "/balances", label: "Balances", icon: Scale },
  { to: "/settlements", label: "Settlements", icon: Handshake },
  { to: "/reports", label: "Reports & Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(path: string, to: string) {
  if (to === "/expenses") return path === "/expenses" || (path.startsWith("/expenses/") && path !== "/expenses/new");
  return path === to || path.startsWith(`${to}/`);
}

export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { me, profile, user, isAdmin } = useGroup();
  const signOut = useSignOut();
  const displayName = me?.name || profile?.full_name || user.email || "You";

  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar px-4 py-5 text-sidebar-foreground">
      <div className="px-2">
        <Logo />
      </div>
      <GroupSwitcher />
      <nav className="flex-1 space-y-0.5 overflow-y-auto scrollbar-thin" aria-label="Main">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/50">Workspace</div>
        {NAV.map((item, i) => {
          const active = isActive(path, item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 animate-in fade-in slide-in-from-left-2 fill-mode-both",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:translate-x-0.5 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-sidebar-primary transition-all duration-300",
                  active ? "opacity-100" : "scale-y-0 opacity-0",
                )}
              />
              <item.icon className={cn("h-[18px] w-[18px] transition-colors", active ? "text-sidebar-primary" : "group-hover:text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 transition-colors hover:bg-sidebar-accent">
        <MemberAvatar name={displayName} seed={me?.id ?? user.id} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-sidebar-accent-foreground">{displayName}</div>
          <div className="text-xs">{isAdmin ? "Admin" : "Member"}</div>
        </div>
        <button onClick={signOut} className="rounded-lg p-1.5 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const navigate = useNavigate();
  const { user, me, profile, can } = useGroup();
  const signOut = useSignOut();
  const displayName = me?.name || profile?.full_name || user.email || "You";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <CommandTrigger onClick={onSearch} />
      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Search" onClick={onSearch}>
          <Search className="h-5 w-5" />
        </Button>
        {can.addExpense && (
          <Button asChild className="hidden bg-gradient-primary shadow-glow transition-transform hover:-translate-y-0.5 sm:inline-flex">
            <Link to="/expenses/new">
              <Plus /> Add expense
            </Link>
          </Button>
        )}
        <ThemeToggle />
        <NotificationsMenu userId={user.id} />
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 rounded-full outline-none ring-offset-2 ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring" aria-label="Account menu">
            <MemberAvatar name={displayName} seed={me?.id ?? user.id} size="sm" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="truncate">{displayName}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">{user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate({ to: "/settlements" })}>
              <ArrowLeftRight className="h-4 w-4" /> Settlements
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={signOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const palette = useCommandPalette();
  const { can } = useGroup();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [loading, setLoading] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(t);
  }, [path]);

  return (
    <div className="min-h-screen bg-background">
      {loading && <div className="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"><div className="h-full w-full origin-left animate-[route-bar_1s_ease-out_forwards] bg-gradient-primary" /></div>}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <SidebarBody />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 border-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarBody onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="lg:pl-64">
        <TopBar onMenu={() => setOpen(true)} onSearch={() => palette.setOpen(true)} />
        <main key={path} className="relative page-enter mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">{loading ? <PageLoader /> : children}</main>
      </div>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} />
      {can.addExpense && path !== "/expenses/new" && (
        <Button asChild size="icon" className="fixed bottom-5 right-5 z-30 h-14 w-14 rounded-full bg-gradient-primary shadow-glow transition-transform active:scale-95 sm:hidden" aria-label="Add expense">
          <Link to="/expenses/new">
            <Plus className="!size-6" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4" role="status" aria-label="Loading page">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-primary-soft" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
        <div className="absolute inset-3 animate-pulse rounded-full bg-gradient-primary opacity-80" />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />)}
      </div>
    </div>
  );
}
