import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getInvite, pinLogin } from "@/lib/pin/member-pin.functions";
import { Logo } from "@/components/app/Logo";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Join your household — Family Expense Tracker" },
      { name: "description", content: "Pick your name and enter your PIN to see your household's shared expenses." },
      { property: "og:title", content: "You're invited — Family Expense Tracker" },
      { property: "og:description", content: "Tap to see your household's shared expenses and balances." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const invite = useQuery({ queryKey: ["invite", token], queryFn: () => getInvite({ data: { token } }) });
  const [memberId, setMemberId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!memberId) return;
    setBusy(true);
    try {
      const s = await pinLogin({ data: { token, memberId, pin } });
      await supabase.auth.signOut();
      const { error } = await supabase.auth.setSession(s);
      if (error) throw error;
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
      setPin("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="card-surface w-full max-w-md p-6 fade-up">
        <Logo />
        {invite.isLoading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-muted-foreground" /></div>
        ) : !invite.data ? (
          <p className="mt-6 text-sm text-muted-foreground">This invite link isn't valid anymore. Ask your household admin for a new one.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <h1 className="text-xl font-semibold">Join {invite.data.name}</h1>
              <p className="text-sm text-muted-foreground">Pick your name and enter the PIN your admin gave you.</p>
            </div>
            {invite.data.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has a PIN yet. Ask your admin to set one for you.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {invite.data.members.map((m) => (
                  <button type="button" key={m.id} onClick={() => setMemberId(m.id)}
                    className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${memberId === m.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}>
                    <MemberAvatar name={m.name} seed={m.id} /> <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            )}
            {memberId && (
              <div className="space-y-1.5">
                <Label htmlFor="pin">PIN</Label>
                <Input id="pin" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus
                  value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} className="text-center text-2xl tracking-[0.5em]" />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={!memberId || pin.length < 4 || busy}>
              {busy && <Loader2 className="animate-spin" />} Open household
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
