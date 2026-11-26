import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getInvite, pinLogin } from "@/lib/pin/member-pin.functions";
import { Logo } from "@/components/app/Logo";
import { MemberAvatar } from "@/components/app/MemberAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/join/$token")({
  head: () => ({
    meta: [
      { title: "Join your household — Family Expense Tracker" },
      { name: "description", content: "Sign in with your Gmail and PIN to see your household's shared expenses." },
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
  const [loginBy, setLoginBy] = useState<"email" | "name">("email");
  const [email, setEmail] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);

  const canSubmit =
    pin.length >= 4 &&
    !busy &&
    (loginBy === "email" ? email.trim().includes("@") : !!memberId);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const s = await pinLogin({
        data:
          loginBy === "email"
            ? { token, email: email.trim(), pin }
            : { token, memberId: memberId!, pin },
      });
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
        <Logo tone="dark" />
        {invite.isLoading ? (
          <div className="py-12 text-center"><Loader2 className="mx-auto animate-spin text-muted-foreground" /></div>
        ) : invite.isError ? (
          <p className="mt-6 text-sm text-destructive">
            {invite.error instanceof Error
              ? invite.error.message
              : "Invite login is not configured on the server yet."}
          </p>
        ) : !invite.data ? (
          <p className="mt-6 text-sm text-muted-foreground">This invite link isn&apos;t valid anymore. Ask your household admin for a new one.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div>
              <h1 className="text-xl font-semibold">Join {invite.data.name}</h1>
              <p className="text-sm text-muted-foreground">
                Enter your Gmail and the PIN your household admin gave you.
              </p>
            </div>

            {invite.data.members.length === 0 ? (
              <p className="text-sm text-muted-foreground">No one has a PIN yet. Ask your admin to set one for you.</p>
            ) : (
              <>
                <Tabs value={loginBy} onValueChange={(v) => setLoginBy(v as "email" | "name")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">Gmail + PIN</TabsTrigger>
                    <TabsTrigger value="name">Pick Name</TabsTrigger>
                  </TabsList>
                </Tabs>

                {loginBy === "email" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="invite-email">Your Gmail</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="sareenaghimire21@gmail.com"
                      autoComplete="email"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {invite.data.members.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setMemberId(m.id)}
                        className={`flex items-center gap-2 rounded-xl border p-3 text-left text-sm font-medium transition ${
                          memberId === m.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                        }`}
                      >
                        <MemberAvatar name={m.name} seed={m.id} /> <span className="truncate">{m.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="pin">PIN (4–6 digits)</Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      placeholder="••••"
                      className="pr-10 text-center text-2xl tracking-[0.5em]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin((v) => !v)}
                      aria-label={showPin ? "Hide PIN" : "Show PIN"}
                      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" className="w-full" disabled={!canSubmit}>
              {busy && <Loader2 className="animate-spin" />} Open household
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
