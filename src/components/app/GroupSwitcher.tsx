import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateGroupForm } from "./CreateGroupForm";

export function GroupSwitcher() {
  const { group, memberships, switchGroup, refresh, profile, members } = useGroup();
  const [open, setOpen] = useState(false);
  const activeCount = members.filter((m) => m.status === "active").length;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl bg-sidebar-accent px-3 py-2.5 text-left outline-none transition hover:bg-sidebar-accent/80 focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-sidebar-accent-foreground">{group.name}</div>
            <div className="text-xs text-sidebar-foreground">
              {activeCount} {activeCount === 1 ? "member" : "members"} · {group.currency}
            </div>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Your groups</DropdownMenuLabel>
          {memberships.map((m) => (
            <DropdownMenuItem key={m.group_id} onSelect={() => switchGroup(m.group_id)}>
              <span className="flex-1 truncate">{m.group?.name ?? "Group"}</span>
              {m.group_id === group.id && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Create new group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a new group</DialogTitle>
            <DialogDescription>Keep a separate set of shared expenses, e.g. for a trip or flat.</DialogDescription>
          </DialogHeader>
          <CreateGroupForm
            defaultName={profile?.full_name}
            onCreated={async (id) => {
              await refresh();
              switchGroup(id);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
