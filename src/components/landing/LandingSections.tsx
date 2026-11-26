import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Handshake,
  History,
  Home,
  PieChart,
  Receipt,
  Scale,
  ShieldCheck,
  Sparkles,
  Split,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Create Your Family",
    desc: "Register your account and add or invite family members.",
    icon: UserPlus,
    accent: "bg-[#DDF7ED] text-[#079B76]",
  },
  {
    num: "02",
    title: "Track Shared Expenses",
    desc: "Record groceries, rent, bills, outings and other expenses. Choose how each expense is divided.",
    icon: Receipt,
    accent: "bg-[#E7F0FF] text-[#2563EB]",
  },
  {
    num: "03",
    title: "Settle Up Easily",
    desc: "See everyone's balances and suggested settlements.",
    icon: Handshake,
    accent: "bg-[#F3E8FF] text-[#8B5CF6]",
  },
];

const FEATURES = [
  {
    icon: Users,
    title: "Shared Expense Tracking",
    desc: "Keep every household bill, grocery run, and shared purchase organized in one place with payer and date tracking.",
    iconStyle: "bg-[#DDF7ED] text-[#079B76]",
  },
  {
    icon: Split,
    title: "Flexible Expense Splitting",
    desc: "Split bills equally across everyone, enter exact Rupee amounts, divide by percentages, or assign to one person.",
    iconStyle: "bg-[#E7F0FF] text-[#2563EB]",
  },
  {
    icon: Scale,
    title: "Live Member Balances",
    desc: "Always know how much each member paid, their total fair share, and whether they owe or are owed money.",
    iconStyle: "bg-[#F3E8FF] text-[#8B5CF6]",
  },
  {
    icon: Sparkles,
    title: "Smart Settlement Suggestions",
    desc: "Automatic debt simplification calculates the fewest transfers required to settle everyone's balances.",
    iconStyle: "bg-[#DDF7ED] text-[#079B76]",
  },
  {
    icon: BarChart3,
    title: "Monthly Reports",
    desc: "Inspect 6-month and 12-month spending trends alongside paid-vs-share comparisons per family member.",
    iconStyle: "bg-[#E7F0FF] text-[#2563EB]",
  },
  {
    icon: PieChart,
    title: "Category-wise Spending",
    desc: "See where household money goes across Groceries, Rent, Utilities, Food, Transport, Shopping, Health, and more.",
    iconStyle: "bg-[#F3E8FF] text-[#8B5CF6]",
  },
  {
    icon: History,
    title: "Expense History",
    desc: "Search by title or notes and filter every past expense by category, member, or custom date range.",
    iconStyle: "bg-[#FEF3C7] text-[#D97706]",
  },
  {
    icon: Download,
    title: "CSV Export",
    desc: "Export filtered expenses with itemized member shares into clean CSV spreadsheets whenever you need backups.",
    iconStyle: "bg-[#DDF7ED] text-[#079B76]",
  },
];

const FAQS = [
  {
    q: "How many people can use one Family Expense Tracker group?",
    a: "It is designed specifically for households, families, and shared homes of 4–5 members, though you can add as many active members to your group as needed.",
  },
  {
    q: "What ways can we split an expense?",
    a: "You can divide any expense equally across all or selected members, enter exact custom amounts per person, split by percentages, or record a 1-to-1 expense for a single member.",
  },
  {
    q: "How does the app calculate who owes whom?",
    a: "Every time an expense or settlement is recorded, the app totals what each member paid minus their fair share. It then simplifies group debts into the fewest suggested transfers.",
  },
  {
    q: "Do all family members need to configure everything themselves?",
    a: "No. The family admin sets up the household group, adds or invites members, manages permissions, and can even configure PINs or eSewa details for members.",
  },
  {
    q: "Can we view past reports and export our expense data?",
    a: "Yes. The Reports page displays monthly trends, category breakdowns, and member paid-vs-share charts, and the Expenses page includes one-click CSV export.",
  },
];

type InfoModalType = "privacy" | "terms" | "contact" | null;

export function AboutSection() {
  return (
    <section id="about" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 rounded-3xl border border-[#DCE8E4] bg-[#F7FAF9] p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF7ED] px-3 py-1 text-xs font-bold text-[#079B76]">
              <Home className="h-3.5 w-3.5" /> Built for Shared Homes
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#102B35] sm:text-3xl">
              No more scattered chats, lost receipts, or awkward money reminders.
            </h2>
            <p className="text-sm leading-relaxed text-[#64748B] sm:text-base">
              Managing household costs across 4–5 people gets messy fast when one person pays rent,
              another buys groceries, and someone else covers electricity. Family Expense Tracker
              gives your home one shared source of truth where every bill, split, and repayment
              stays transparent.
            </p>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            {[
              {
                icon: ShieldCheck,
                title: "Role-Based Control",
                desc: "Admins manage group settings, member access, and approvals.",
                tone: "bg-[#DDF7ED] text-[#079B76]",
              },
              {
                icon: Wallet,
                title: "eSewa Ready",
                desc: "Save member eSewa numbers & QR codes for faster settle-ups.",
                tone: "bg-[#E7F0FF] text-[#2563EB]",
              },
              {
                icon: FileSpreadsheet,
                title: "Clean Records",
                desc: "Every rupee and paisa balances out with itemized history.",
                tone: "bg-[#F3E8FF] text-[#8B5CF6]",
              },
              {
                icon: Users,
                title: "Invite or Add",
                desc: "Add family members manually or invite them via link & PIN.",
                tone: "bg-[#DDF7ED] text-[#079B76]",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-[#DCE8E4] bg-white p-4 shadow-xs"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.tone}`}
                >
                  <card.icon className="h-4 w-4" />
                </div>
                <div className="mt-3 text-sm font-bold text-[#102B35]">{card.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-[#64748B]">{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#F7FAF9] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E7F0FF] px-3 py-1 text-xs font-bold text-[#2563EB]">
            Simple 3-Step Workflow
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#102B35] sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-3 text-base text-[#64748B]">
            Get your household organized in minutes — no steep learning curve required.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.num}
              className="group relative rounded-3xl border border-[#DCE8E4] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#079B76]/35 hover:shadow-xl hover:shadow-[#102B35]/5"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${step.accent}`}
                >
                  <step.icon className="h-6 w-6" />
                </div>
                <span className="text-3xl font-black tracking-tighter text-[#DCE8E4] transition-colors group-hover:text-[#079B76]/30">
                  {step.num}
                </span>
              </div>
              <div className="mt-6 text-xs font-bold uppercase tracking-wider text-[#079B76]">
                Step {step.num}
              </div>
              <h3 className="mt-1.5 text-xl font-bold text-[#102B35]">{step.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-[#64748B]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF7ED] px-3 py-1 text-xs font-bold text-[#079B76]">
            Powerful Household Tools
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#102B35] sm:text-4xl">
            Everything Built for Fair Family Finance
          </h2>
          <p className="mt-3 text-base text-[#64748B]">
            Practical tools designed around real household expenses, flexible splits, and clear
            monthly accountability.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-3xl border border-[#E2ECE9] bg-[#FAFDFC] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#079B76]/35 hover:bg-white hover:shadow-xl hover:shadow-[#102B35]/5"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${f.iconStyle}`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-base font-bold text-[#102B35]">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-[#F7FAF9] py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-bold text-[#8B5CF6]">
            Questions & Answers
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#102B35] sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-[#64748B]">
            Quick answers on how splitting, balances, settlements, and reports work.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-2xl border border-[#DCE8E4] bg-white transition-shadow hover:shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-sm font-bold text-[#102B35] sm:text-base">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#079B76] transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#F1F5F4] px-5 pb-4 pt-3 text-sm leading-relaxed text-[#64748B]">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function FinalCtaSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-[#102B35] px-6 py-14 text-center text-white shadow-2xl shadow-[#102B35]/20 sm:px-12 sm:py-16">
          {/* Subtle atmospheric glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#079B76]/35 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#8B5CF6]/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl space-y-5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-bold text-[#DDF7ED]">
              Ready for Fair Household Tracking
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Start Managing Shared Expenses the Smarter Way.
            </h2>
            <p className="text-base text-white/75 sm:text-lg">
              Bring everyone onto the same page. Track spending, understand balances and settle
              expenses with confidence.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
              <Link
                to={signedIn ? "/dashboard" : "/auth"}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#079B76] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#079B76]/30 transition-all hover:-translate-y-0.5 hover:bg-[#08B388] sm:text-base"
              >
                {signedIn ? "Open Dashboard" : "Create Your Family Account"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              {!signedIn && (
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur transition-all hover:bg-white/20 sm:text-base"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  const [modal, setModal] = useState<InfoModalType>(null);

  return (
    <footer className="border-t border-[#DCE8E4] bg-[#F7FAF9]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand & Short Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#079B76] text-white">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#102B35]">Family Expense Tracker</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#079B76]">
                  Track · Split · Settle
                </div>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#64748B]">
              A shared expense management workspace built for families and shared homes of 4–5
              members to track costs, balance shares, and settle up fairly.
            </p>
          </div>

          {/* Product Navigation */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#102B35]">
              Navigation
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
              <li>
                <a href="#home" className="transition-colors hover:text-[#079B76]">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="transition-colors hover:text-[#079B76]">
                  About
                </a>
              </li>
              <li>
                <a href="#features" className="transition-colors hover:text-[#079B76]">
                  Features
                </a>
              </li>
              <li>
                <a href="#faq" className="transition-colors hover:text-[#079B76]">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#102B35]">
              Support & Legal
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
              <li>
                <button
                  type="button"
                  onClick={() => setModal("privacy")}
                  className="transition-colors hover:text-[#079B76]"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModal("terms")}
                  className="transition-colors hover:text-[#079B76]"
                >
                  Terms and Conditions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModal("contact")}
                  className="transition-colors hover:text-[#079B76]"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#DCE8E4] pt-6 text-xs text-[#64748B]">
          <span>© {new Date().getFullYear()} Family Expense Tracker. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/auth" className="font-semibold text-[#079B76] hover:underline">
              Sign In
            </Link>
            <Link to="/auth" className="font-semibold text-[#102B35] hover:underline">
              Create Family Account
            </Link>
          </div>
        </div>
      </div>

      {/* Info Modal for Privacy Policy, Terms & Contact */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#102B35]/50 p-4 backdrop-blur-xs"
          onClick={() => setModal(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-[#DCE8E4] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#F1F5F4] pb-3">
              <h3 className="text-lg font-bold text-[#102B35]">
                {modal === "privacy"
                  ? "Privacy Policy"
                  : modal === "terms"
                    ? "Terms and Conditions"
                    : "Contact"}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#F7FAF9] hover:text-[#102B35]"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[#64748B]">
              {modal === "privacy" && (
                <p>
                  Your household expenses, member profiles, and settlement records stay strictly
                  under your family group&apos;s control. We never sell or share your financial
                  records with third-party advertisers.
                </p>
              )}
              {modal === "terms" && (
                <p>
                  Family Expense Tracker is designed to help families and shared homes record
                  shared expenses and calculate fair splits. Group admins manage member access and
                  settlement confirmations inside each household.
                </p>
              )}
              {modal === "contact" && (
                <p>
                  Have a question about setting up your family group or managing members? Reach out
                  to your group administrator or sign in to manage settings directly in your
                  workspace.
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-xl bg-[#079B76] px-4 py-2 text-xs font-bold text-white hover:bg-[#068263]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
