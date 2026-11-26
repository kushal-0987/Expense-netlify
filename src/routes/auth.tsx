import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/app/Logo";
import { SocialButtons } from "@/components/app/SocialButtons";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Family Expense Tracker" },
      { name: "description", content: "Sign in or create an account to manage shared family expenses." },
      { property: "og:title", content: "Sign in — Family Expense Tracker" },
      { property: "og:description", content: "Sign in or create an account to manage shared family expenses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<null | "confirm" | "reset">(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/dashboard", replace: true });
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Use at least 8 characters for your password.");
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth`,
            data: { full_name: name.trim() },
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created successfully!");
          navigate({ to: "/dashboard", replace: true });
        } else {
          setSent("confirm");
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("reset");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="auth-panel relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Logo />
        <div className="max-w-md space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Shared expenses, settled without the awkward conversations.
          </h1>
          <ul className="space-y-3 text-sm text-sidebar-foreground">
            {[
              "Split bills equally, by amount or by percentage",
              "See who owes whom at a glance",
              "Settle up in the fewest payments possible",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-sidebar-foreground">Built for families, flatmates and friends.</p>
      </aside>

      <main className="flex items-center justify-center bg-background px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo tone="dark" />
          </div>

          {sent ? (
            <div className="card-surface space-y-4 p-8 text-center fade-up">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <MailCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">Check your email</h2>
              <p className="text-sm text-muted-foreground">
                {sent === "confirm"
                  ? `We sent a confirmation link to ${email}. Open it to activate your account.`
                  : `If an account exists for ${email}, you'll get a link to choose a new password.`}
              </p>
              <Button variant="outline" onClick={() => { setSent(null); setMode("signin"); }}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <div className="card-surface p-6 sm:p-8 fade-up">
              <h2 className="text-2xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset your password"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "forgot"
                  ? "Enter your email and we'll send you a reset link."
                  : "Manage your household money together."}
              </p>

              {mode !== "forgot" && (
                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-6">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign in</TabsTrigger>
                    <TabsTrigger value="signup">Sign up</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}

              <form onSubmit={submit} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} placeholder="Kushal Pokhrel" autoComplete="name" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                {mode !== "forgot" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {mode === "signin" && (
                        <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={() => setMode("forgot")}>
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={mode === "signup" ? 8 : 1}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <Button type="submit" size="lg" className="w-full" disabled={busy}>
                  {busy && <Loader2 className="animate-spin" />}
                  {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
                </Button>
                {mode === "forgot" && (
                  <Button type="button" variant="ghost" className="w-full" onClick={() => setMode("signin")}>
                    Back to sign in
                  </Button>
                )}
              </form>

              {mode !== "forgot" && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    or
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <SocialButtons />
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
