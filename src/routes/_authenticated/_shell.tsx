import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, LogOut } from "lucide-react";
import { GroupProvider, useGroupLoader } from "@/hooks/use-group";
import { AppShell, useSignOut } from "@/components/app/AppShell";
import { CreateGroupForm } from "@/components/app/CreateGroupForm";
import { Logo } from "@/components/app/Logo";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { qk } from "@/lib/data/queries";

export const Route = createFileRoute("/_authenticated/_shell")({
  component: ShellLayout,
});

function ShellLayout() {
  const { user } = Route.useRouteContext();
  const state = useGroupLoader(user);
  const queryClient = useQueryClient();
  const signOut = useSignOut();

  if (state.status === "loading") return <ShellSkeleton />;

  if (state.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="card-surface max-w-md space-y-4 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="text-lg font-bold">We couldn't load your household</h1>
          <p className="text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button onClick={state.retry}>Try again</Button>
        </div>
      </div>
    );
  }

  if (state.status === "empty") {
    const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-between">
            <Logo tone="dark" />
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut /> Sign out
            </Button>
          </div>
          <div className="card-surface p-6 sm:p-8 fade-up">
            <h1 className="text-2xl font-semibold tracking-tight">Set up your household</h1>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Create a group for your family or flat. You'll be its admin and can add members next.
              Invited by someone? Ask them to add your email ({user.email}) as a member — it will appear here automatically.
            </p>
            <CreateGroupForm
              defaultName={meta?.full_name ?? meta?.name ?? ""}
              onCreated={async (id) => {
                window.localStorage.setItem("fet.activeGroup", id);
                await queryClient.invalidateQueries({ queryKey: qk.memberships(user.id) });
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <GroupProvider value={state.value}>
      <AppShell>
        <Outlet />
      </AppShell>
    </GroupProvider>
  );
}

function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 hidden w-64 bg-sidebar lg:block" />
      <div className="lg:pl-64">
        <div className="h-16 border-b bg-card" />
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-56" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
