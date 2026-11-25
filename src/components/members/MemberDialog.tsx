import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useGroup } from "@/hooks/use-group";
import type { Member } from "@/lib/data/types";
import { addMember, updateMember } from "@/lib/data/api";
import { todayISO } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function MemberDialog({ open, onOpenChange, member }: { open: boolean; onOpenChange: (v: boolean) => void; member: Member | null }) {
  const { group, refresh } = useGroup();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [joined, setJoined] = useState(todayISO());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? "");
    setEmail(member?.email ?? "");
    setRole(member?.role ?? "member");
    setStatus(member?.status ?? "active");
    setJoined(member?.joined_at ?? todayISO());
  }, [open, member]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return void toast.error("Enter a name");
    if (email.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return void toast.error("That email doesn't look right");
    setBusy(true);
    try {
      const input = { name, email: email.trim() || null, role, status, joined_at: joined };
      if (member) await updateMember(member.id, member.user_id ? { name, role, status, joined_at: joined } : input);
      else await addMember(group.id, input);
      await refresh();
      toast.success(member ? "Member updated" : `${name.trim()} added`);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the member");
    } finally {
      setBusy(false);
    }
  }

  const linked = !!member?.user_id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{member ? "Edit member" : "Add a member"}</DialogTitle>
          <DialogDescription>
            {member ? "Update their details or role." : "Add their email so they can sign in and see this group. You can also add people without an account."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="m-name">Name</Label>
            <Input id="m-name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-email">Email (optional)</Label>
            <Input id="m-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="aarav@example.com" disabled={linked} />
            {linked && <p className="text-xs text-muted-foreground">This member's account is linked, so the email can't be changed.</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "member")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as "active" | "inactive")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="m-joined">Joined on</Label>
            <Input id="m-joined" type="date" value={joined} max={todayISO()} onChange={(e) => setJoined(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy && <Loader2 className="animate-spin" />}{member ? "Save" : "Add member"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
