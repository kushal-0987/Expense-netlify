import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Handshake, PieChart, Scale, Split, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import heroImage from "@/assets/family-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Expense Tracker — split household costs fairly" },
      {
        name: "description",
        content:
          "Record shared expenses, split costs, track each member's contribution and settle up with the fewest payments.",
      },
      { property: "og:title", content: "Family Expense Tracker — split household costs fairly" },
      {
        property: "og:description",
        content: "Record shared expenses, split costs and settle up with family and flatmates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Split, title: "Flexible splits", body: "Equal, exact amounts, percentages or one person — shares always add up to the paisa." },
  { icon: Scale, title: "Live balances", body: "Everyone sees what they paid, what they owe and what they'll get back." },
  { icon: Handshake, title: "Smart settle-up", body: "We suggest the fewest payments needed to clear every balance." },
  { icon: BarChart3, title: "Clear reports", body: "Monthly trends, category breakdowns and CSV exports for your records." },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo tone="dark" />
        <div className="flex items-center gap-2">
          {signedIn ? (
            <Button asChild>
              <Link to="/dashboard">
                Open dashboard <ArrowRight />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 lg:grid-cols-2 lg:pt-16">
        <div className="fade-up space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            <Users className="h-3.5 w-3.5" /> For families of 4–5 and shared homes
          </span>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
            Know exactly who paid, who owes, and how to settle up.
          </h1>
          <p className="max-w-lg text-lg text-muted-foreground">
            One shared place for rent, groceries, bills and outings. Add an expense in seconds and
            the balances update for everyone.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to={signedIn ? "/dashboard" : "/auth"}>
                {signedIn ? "Go to dashboard" : "Start tracking free"} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <img
            src={heroImage}
            alt="A family reviewing household expenses together at the kitchen table"
            width={1536}
            height={1024}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-elevated"
          />
          <div className="card-surface absolute -bottom-6 -left-4 flex items-center gap-3 p-4 sm:-left-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">This month</div>
              <div className="tabular text-lg font-semibold">Rs. 35,844.00</div>
            </div>
          </div>
          <div className="card-surface absolute -right-3 -top-5 hidden p-4 sm:block">
            <div className="text-xs text-muted-foreground">Aarav owes Kushal</div>
            <div className="tabular text-base font-semibold text-destructive">Rs. 1,250.00</div>
          </div>
        </div>
      </section>

      <section className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-16 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="space-y-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-muted-foreground">
        <span>© {new Date().getFullYear()} Family Expense Tracker</span>
        <Link to="/auth" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </footer>
    </div>
  );
}
