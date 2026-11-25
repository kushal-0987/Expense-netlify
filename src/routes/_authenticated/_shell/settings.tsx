import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LogOut, Wallet } from "lucide-react";
import { PaymentDetailsDialog } from "@/components/payments/PaymentDetailsDialog";
import { useGroup } from "@/hooks/use-group";
import { PageHeader } from "@/components/app/PageHeader";
import { useSignOut } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateGroup, updateGroupSettings, updateProfile } from "@/lib/data/api";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_shell/settings")({
  head: () => ({ meta: [{ title: "Settings — Family Expense Tracker" }, { name: "description", content: "Profile, group and permission settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, group, settings, isAdmin, refresh, me } = useGroup();
  const [editPay, setEditPay] = useState(false);
  const signOut = useSignOut();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [groupName, setGroupName] = useState(group.name);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busyPassword, setBusyPassword] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      return toast.error("Use at least 8 characters for your new password.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("The two passwords do not match.");
    }
    setBusyPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusyPassword(false);
    }
  }

  async function run(fn: () => Promise<void>, msg: string) {
    try { await fn(); await refresh(); toast.success(msg); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Could not save"); }
  }

  const perms = [
    { key: "members_can_add_expenses", label: "Members can add expenses" },
    { key: "members_can_edit_own_expenses", label: "Members can edit their own expenses" },
    { key: "members_can_record_settlements", label: "Members can record settlements" },
  ] as const;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Settings" />
      <Card>
        <CardHeader><CardTitle>Your profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5"><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
          <div className="space-y-1.5"><Label htmlFor="fn">Full name</Label><Input id="fn" maxLength={60} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <Button onClick={() => run(() => updateProfile(user.id, { full_name: fullName.trim() }), "Profile saved")}>Save profile</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={changePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="npw">New password</Label>
              <Input
                id="npw"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpw">Confirm new password</Label>
              <Input
                id="cpw"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
            <Button type="submit" disabled={busyPassword || !newPassword}>
              {busyPassword ? "Updating..." : "Update password"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {me && (
        <Card>
          <CardHeader><CardTitle>Your eSewa details</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {me.esewa_phone || me.esewa_qr_path
                ? <>eSewa <span className="tabular font-semibold text-foreground">{me.esewa_phone ?? "QR only"}</span>{me.esewa_qr_path && me.esewa_phone ? " · QR added" : ""}</>
                : "Add your eSewa number and QR so others in this household can pay you back."}
            </p>
            <Button variant="outline" onClick={() => setEditPay(true)}><Wallet /> {me.esewa_phone || me.esewa_qr_path ? "Edit" : "Add eSewa"}</Button>
          </CardContent>
        </Card>
      )}
      <PaymentDetailsDialog member={editPay ? me : null} onClose={() => setEditPay(false)} />
      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>Group</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5"><Label htmlFor="gn">Group name</Label><Input id="gn" maxLength={80} value={groupName} onChange={(e) => setGroupName(e.target.value)} /></div>
            <Button onClick={() => run(() => updateGroup(group.id, { name: groupName.trim() }), "Group saved")} disabled={!groupName.trim()}>Save group</Button>
            <div className="space-y-3 border-t pt-4">
              {perms.map((p) => (
                <label key={p.key} className="flex items-center justify-between text-sm font-semibold">
                  {p.label}
                  <Switch checked={settings[p.key]} onCheckedChange={(v) => run(() => updateGroupSettings(group.id, { [p.key]: v }), "Permissions updated")} />
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      <Button variant="outline" onClick={signOut}><LogOut /> Sign out</Button>
    </div>
  );
}
