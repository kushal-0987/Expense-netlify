import { useState } from "react";
import { toast } from "sonner";
import { Copy, Link2, MessageCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGroup } from "@/hooks/use-group";
import { Button } from "@/components/ui/button";

export function InviteCard() {
  const { group, refresh } = useGroup();
  const [busy, setBusy] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/join/${group.invite_token}` : "";
  const text = `Join our household "${group.name}" to see shared expenses: ${link}`;

  async function reset() {
    setBusy(true);
    const { error } = await supabase.rpc("regenerate_invite_token", { p_group_id: group.id });
    setBusy(false);
    if (error) return void toast.error("Could not reset the link");
    await refresh();
    toast.success("New link created — the old one no longer works");
  }

  return (
    <div className="card-surface mb-6 p-5 fade-up">
      <div className="flex items-center gap-2 font-semibold"><Link2 className="h-4 w-4 text-primary" /> Invite link</div>
      <p className="mt-1 text-sm text-muted-foreground">Set a PIN for each member (⋮ → Set PIN), then send them this link. They pick their name and type the PIN.</p>
      <div className="mt-3 truncate rounded-lg bg-muted px-3 py-2 font-mono text-xs">{link}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => { void navigator.clipboard.writeText(link); toast.success("Link copied"); }}><Copy /> Copy link</Button>
        <Button size="sm" variant="outline" asChild><a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a></Button>
        <Button size="sm" variant="outline" asChild><a href={`mailto:?subject=${encodeURIComponent("Join our household")}&body=${encodeURIComponent(text)}`}>Email</a></Button>
        <Button size="sm" variant="ghost" onClick={reset} disabled={busy}><RefreshCw /> New link</Button>
      </div>
    </div>
  );
}
