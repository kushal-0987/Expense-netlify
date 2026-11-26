import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Plus,
  Receipt,
  ShieldCheck,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const SAMPLE_AVATARS = [
  { initials: "KP", bg: "bg-[#079B76]", name: "Kushal" },
  { initials: "SR", bg: "bg-[#8B5CF6]", name: "Sareena" },
  { initials: "AR", bg: "bg-[#2563EB]", name: "Aarav" },
  { initials: "MY", bg: "bg-[#F59E0B]", name: "Maya" },
];

const SAMPLE_EXPENSES = [
  {
    title: "Monthly Groceries",
    meta: "Kushal paid · Split 4 ways",
    amount: "Rs. 4,850.00",
    date: "Today",
    iconBg: "bg-[#DDF7ED] text-[#079B76]",
  },
  {
    title: "Electricity & Internet",
    meta: "Sareena paid · Equal split",
    amount: "Rs. 2,400.00",
    date: "Yesterday",
    iconBg: "bg-[#E7F0FF] text-[#2563EB]",
  },
  {
    title: "Family Dinner Out",
    meta: "Aarav paid · Custom split",
    amount: "Rs. 3,200.00",
    date: "2 days ago",
    iconBg: "bg-[#F3E8FF] text-[#8B5CF6]",
  },
];

export function HeroSection({ signedIn }: { signedIn: boolean }) {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-[#F7FAF9] pb-16 pt-10 sm:pb-24 sm:pt-14 lg:pt-16"
    >
      {/* Soft Fintech Ambient Background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full bg-[#DDF7ED] opacity-80 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-10 h-[520px] w-[520px] rounded-full bg-[#E7F0FF] opacity-80 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-96 rounded-full bg-[#8B5CF6]/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_1.18fr] lg:gap-10 lg:px-8">
        {/* Left Copy & Actions */}
        <div className="fade-up space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#079B76]/20 bg-[#DDF7ED]/90 px-3.5 py-1.5 text-xs font-bold tracking-wide text-[#079B76] shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#079B76]" />
            Track. Split. Settle. Save.
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-[#102B35] sm:text-5xl lg:text-[3.4rem]">
            Manage Your Family Expenses{" "}
            <span className="bg-gradient-to-r from-[#079B76] to-[#0EA57E] bg-clip-text text-transparent">
              Together.
            </span>
          </h1>

          <p className="max-w-xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            One shared place for rent, groceries, bills and everyday spending. Add an expense in
            seconds, see everyone&apos;s balances and settle up without confusion.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-wrap items-center gap-3.5 pt-1">
            <Link
              to={signedIn ? "/dashboard" : "/auth"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#079B76] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#079B76]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#068263] hover:shadow-xl hover:shadow-[#079B76]/30 sm:text-base"
            >
              {signedIn ? "Go to Dashboard" : "Create Family Account"}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {!signedIn && (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#CBD8D4] bg-white px-6 py-3.5 text-sm font-bold text-[#102B35] shadow-xs transition-all duration-200 hover:border-[#079B76]/40 hover:bg-[#F7FAF9] sm:text-base"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Supporting Household Text & Avatars */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <div className="flex -space-x-2.5">
              {SAMPLE_AVATARS.map((av) => (
                <div
                  key={av.initials}
                  title={av.name}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-xs ${av.bg}`}
                >
                  {av.initials}
                </div>
              ))}
              <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#DDF7ED] text-xs font-bold text-[#079B76] shadow-xs">
                +1
              </div>
            </div>
            <p className="text-sm font-medium text-[#64748B]">
              Designed for families and shared homes of{" "}
              <span className="font-semibold text-[#102B35]">4–5 members</span>.
            </p>
          </div>
        </div>

        {/* Right: Realistic Product Showcase (Desktop + Smartphone + Floating Cards) */}
        <div className="relative mx-auto w-full max-w-2xl pb-8 pt-4 lg:pb-6 lg:pt-2">
          {/* Top-right Floating Card: Secure & Shared */}
          <div className="float-slow absolute -right-2 -top-2 z-30 hidden items-center gap-2.5 rounded-2xl border border-[#E2ECE9] bg-white/95 px-3.5 py-2.5 shadow-lg shadow-[#102B35]/10 backdrop-blur sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DDF7ED] text-[#079B76]">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#102B35]">Shared with Family</div>
              <div className="text-[10px] font-medium text-[#64748B]">4 active members</div>
            </div>
          </div>

          {/* Desktop Dashboard Mockup */}
          <div className="relative z-10 overflow-hidden rounded-3xl border border-[#DCE8E4] bg-white p-4 shadow-2xl shadow-[#102B35]/10 sm:mr-14 sm:p-5">
            {/* Desktop Window Header */}
            <div className="flex items-center justify-between border-b border-[#EDF3F1] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#079B76] text-white">
                  <Wallet className="h-3.5 w-3.5" />
                </div>
                <span className="text-sm font-bold text-[#102B35]">Family Expense</span>
                <span className="rounded-full bg-[#F7FAF9] px-2 py-0.5 text-[10px] font-semibold text-[#64748B]">
                  Sample preview
                </span>
              </div>

              {/* Member Avatars inside Desktop Header */}
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1.5">
                  {SAMPLE_AVATARS.map((av) => (
                    <div
                      key={av.initials}
                      className={`flex h-6 w-6 items-center justify-center rounded-full border border-white text-[9px] font-bold text-white ${av.bg}`}
                    >
                      {av.initials}
                    </div>
                  ))}
                </div>
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DDF7ED] text-[#079B76]">
                  <Plus className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Desktop Summary KPIs Row */}
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-[#EDF3F1] bg-[#F7FAF9] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#64748B]">Total Expenses</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#DDF7ED] text-[#079B76]">
                    <Receipt className="h-3 w-3" />
                  </span>
                </div>
                <div className="tabular mt-1.5 text-sm font-extrabold text-[#102B35] sm:text-base">
                  Rs. 35,844
                </div>
              </div>

              <div className="rounded-2xl border border-[#EDF3F1] bg-[#F7FAF9] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#64748B]">Monthly Spending</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#E7F0FF] text-[#2563EB]">
                    <BarChart3 className="h-3 w-3" />
                  </span>
                </div>
                <div className="tabular mt-1.5 text-sm font-extrabold text-[#102B35] sm:text-base">
                  Rs. 12,450
                </div>
              </div>

              <div className="rounded-2xl border border-[#8B5CF6]/15 bg-[#F5F3FF]/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#64748B]">Your Balance</span>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    <TrendingUp className="h-3 w-3" />
                  </span>
                </div>
                <div className="tabular mt-1.5 text-sm font-extrabold text-[#079B76] sm:text-base">
                  +Rs. 8,230
                </div>
              </div>
            </div>

            {/* Monthly Spending Chart */}
            <div className="mt-4 rounded-2xl border border-[#EDF3F1] bg-white p-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#102B35]">Monthly Spending</span>
                <span className="rounded-lg bg-[#DDF7ED] px-2 py-0.5 text-[10px] font-semibold text-[#079B76]">
                  Last 6 months
                </span>
              </div>
              <svg viewBox="0 0 360 95" className="h-24 w-full overflow-visible" aria-hidden>
                <defs>
                  <linearGradient id="heroChartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#079B76" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#079B76" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                {/* Horizontal subtle grid lines */}
                <line x1="0" y1="20" x2="360" y2="20" stroke="#EDF3F1" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="360" y2="50" stroke="#EDF3F1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="360" y2="80" stroke="#EDF3F1" />

                {/* Area fill */}
                <path
                  d="M10,70 C55,65 80,45 120,52 C160,58 190,34 235,38 C275,42 305,18 350,15 L350,80 L10,80 Z"
                  fill="url(#heroChartGrad)"
                />
                {/* Line path */}
                <path
                  d="M10,70 C55,65 80,45 120,52 C160,58 190,34 235,38 C275,42 305,18 350,15"
                  fill="none"
                  stroke="#079B76"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Data dots */}
                {[
                  [10, 70],
                  [75, 53],
                  [145, 53],
                  [215, 38],
                  [285, 28],
                  [350, 15],
                ].map(([cx, cy], idx) => (
                  <circle
                    key={idx}
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="#FFFFFF"
                    stroke="#079B76"
                    strokeWidth="2.2"
                  />
                ))}
                {/* Month labels */}
                {["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"].map((m, idx) => (
                  <text
                    key={m}
                    x={10 + idx * 66}
                    y="93"
                    fontSize="9"
                    fill="#64748B"
                    fontWeight="500"
                  >
                    {m}
                  </text>
                ))}
              </svg>
            </div>

            {/* Recent Expenses inside Desktop Mockup */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#102B35]">Recent Expenses</span>
                <span className="text-[11px] font-semibold text-[#079B76]">View all →</span>
              </div>
              <div className="space-y-2">
                {SAMPLE_EXPENSES.map((exp) => (
                  <div
                    key={exp.title}
                    className="flex items-center justify-between rounded-xl border border-[#F1F5F4] bg-[#FAFDFC] px-3 py-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${exp.iconBg}`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#102B35]">{exp.title}</div>
                        <div className="text-[10px] text-[#64748B]">{exp.meta}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="tabular text-xs font-bold text-[#102B35]">{exp.amount}</div>
                      <div className="text-[9px] text-[#64748B]">{exp.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Left Pill: Shared Balance Overview */}
          <div className="absolute -left-2 bottom-24 z-30 hidden items-center gap-2.5 rounded-2xl border border-[#E2ECE9] bg-white/95 px-3.5 py-2.5 shadow-lg shadow-[#102B35]/10 backdrop-blur sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E7F0FF] text-[#2563EB]">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[#102B35]">Smart Settle-up</div>
              <div className="text-[10px] text-[#64748B]">Maya → Kushal · Rs. 1,400</div>
            </div>
          </div>

          {/* Overlapping Smartphone Mockup */}
          <div className="relative z-20 mx-auto -mt-10 w-60 rounded-[2rem] border-[6px] border-[#102B35] bg-white p-3 shadow-2xl shadow-[#102B35]/20 sm:absolute sm:-bottom-2 sm:right-0 sm:mt-0 sm:w-56">
            {/* Phone Notch */}
            <div className="mx-auto mb-2.5 h-3.5 w-16 rounded-full bg-[#102B35]" />

            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-1.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#079B76] text-white">
                  <Wallet className="h-3 w-3" />
                </div>
                <span className="text-[11px] font-bold text-[#102B35]">Family Expense</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#079B76]" />
            </div>

            {/* Mobile Emerald Balance Card */}
            <div className="rounded-2xl bg-gradient-to-br from-[#079B76] to-[#087E61] p-3 text-white shadow-md shadow-[#079B76]/25">
              <div className="text-[10px] font-medium text-white/80">Your Balance</div>
              <div className="tabular mt-0.5 text-lg font-extrabold">+Rs. 8,230.00</div>
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold">
                <CheckCircle2 className="h-2.5 w-2.5" /> Others owe you
              </div>
            </div>

            {/* Mobile Quick Actions */}
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-center">
              <div className="rounded-xl bg-[#F7FAF9] p-2">
                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-lg bg-[#DDF7ED] text-[#079B76]">
                  <Plus className="h-3 w-3" />
                </div>
                <div className="mt-1 text-[9px] font-semibold text-[#102B35]">Add</div>
              </div>
              <div className="rounded-xl bg-[#F7FAF9] p-2">
                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-lg bg-[#E7F0FF] text-[#2563EB]">
                  <UserPlus className="h-3 w-3" />
                </div>
                <div className="mt-1 text-[9px] font-semibold text-[#102B35]">Members</div>
              </div>
              <div className="rounded-xl bg-[#F7FAF9] p-2">
                <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#8B5CF6]">
                  <BarChart3 className="h-3 w-3" />
                </div>
                <div className="mt-1 text-[9px] font-semibold text-[#102B35]">Reports</div>
              </div>
            </div>

            {/* Mobile Recent Activity */}
            <div className="mt-3 space-y-1.5">
              <div className="text-[10px] font-bold text-[#102B35]">Recent Activity</div>
              <div className="flex items-center justify-between rounded-lg bg-[#F7FAF9] px-2 py-1.5">
                <span className="text-[10px] font-medium text-[#102B35]">Groceries</span>
                <span className="tabular text-[10px] font-bold text-[#079B76]">Rs. 4,850</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-[#F7FAF9] px-2 py-1.5">
                <span className="text-[10px] font-medium text-[#102B35]">Electricity</span>
                <span className="tabular text-[10px] font-bold text-[#102B35]">Rs. 2,400</span>
              </div>
            </div>

            {/* Floating Bottom Badge */}
            <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl bg-[#DDF7ED] px-2.5 py-1.5 text-[10px] font-bold text-[#079B76]">
              <Zap className="h-3 w-3" />
              Balances update live
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust & Value Strip inside Hero Container */}
      <div className="relative mx-auto mt-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-3xl border border-[#DCE8E4] bg-white/95 p-5 shadow-md shadow-[#102B35]/5 backdrop-blur sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              bg: "bg-[#DDF7ED] text-[#079B76]",
              title: "Shared Expense Tracking",
              desc: "Keep every member informed",
            },
            {
              icon: BarChart3,
              bg: "bg-[#E7F0FF] text-[#2563EB]",
              title: "Monthly Reports",
              desc: "Understand household spending",
            },
            {
              icon: TrendingUp,
              bg: "bg-[#F3E8FF] text-[#8B5CF6]",
              title: "Live Member Balances",
              desc: "See who owes whom instantly",
            },
            {
              icon: ShieldCheck,
              bg: "bg-[#DDF7ED] text-[#079B76]",
              title: "Clear Settlements",
              desc: "Settle up in fewest payments",
            },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-3.5 rounded-2xl p-2">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.bg}`}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#102B35]">{item.title}</div>
                <div className="text-xs text-[#64748B]">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
