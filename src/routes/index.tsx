import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ProductPreviewSection } from "@/components/landing/ProductPreviewSection";
import {
  AboutSection,
  FaqSection,
  FeaturesSection,
  FinalCtaSection,
  HowItWorksSection,
  LandingFooter,
} from "@/components/landing/LandingSections";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Family Expense Tracker — Manage Your Family Expenses Together" },
      {
        name: "description",
        content:
          "One shared place for rent, groceries, bills and everyday spending. Add an expense in seconds, see everyone's balances and settle up without confusion.",
      },
      {
        property: "og:title",
        content: "Family Expense Tracker — Manage Your Family Expenses Together",
      },
      {
        property: "og:description",
        content:
          "Track, split, and settle shared family expenses effortlessly. Designed for families and shared homes of 4–5 members.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(!!data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(!!session);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen scroll-smooth bg-[#F7FAF9] text-[#102B35] antialiased selection:bg-[#DDF7ED] selection:text-[#079B76]">
      <LandingNavbar signedIn={signedIn} />
      <main>
        <HeroSection signedIn={signedIn} />
        <AboutSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ProductPreviewSection />
        <FaqSection />
        <FinalCtaSection signedIn={signedIn} />
      </main>
      <LandingFooter />
    </div>
  );
}
