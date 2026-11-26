import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Download,
  Handshake,
  LayoutDashboard,
  PieChart,
  Plus,
  Receipt,
  Scale,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

type PreviewTab = "dashboard" | "splits" | "reports";

const MEMBERS_SAMPLE = [
  { name: "Kushal (you)", initials: "KP", bg: "bg-[#079B76]", paid: "Rs. 15,200.00", net: "+Rs. 8,230.00", status: "owed", pct: 100 },
  { name: "Sareena", initials: "SR", bg: "bg-[#8B5CF6]", paid: "Rs. 8,960.00", net: "Rs. 0.00", status: "settled", pct: 12 },
  { name: "Aarav", initials: "AR", bg: "bg-[#2563EB]", paid: "Rs. 6,380.00", net: "-Rs. 4,580.00", status: "owes", pct: 56 },
  { name: "Maya", initials: "MY", bg: "bg-[#F59E0B]", paid: "Rs. 5,304.00", net: "-Rs. 3,650.00", status: "owes", pct: 45 },
];

const RECENT_EXPENSES_SAMPLE = [
  { title: "Monthly Groceries & Produce", payer: "Kushal", date: "Nov 24", split: "Equal (4)", amount: "Rs. 4,850.00", badge: "Groceries", badgeColor: "bg-[#DDF7ED] text-[#079B76]" },
  { title: "House Rent Share", payer: "Kushal", date: "Nov 20", split: "Percentage", amount: "Rs. 18,000.00", badge: "Rent", badgeColor: "bg-[#E7F0FF] text-[#2563EB]" },
  { title: "Electricity & Fiber Internet", payer: "Sareena", date: "Nov 18", split: "Equal (4)", amount: "Rs. 3,490.00", badge: "Utilities", badgeColor: "bg-[#FEF3C7] text-[#B45309]" },
  { title: "Family Dinner Out", payer: "Aarav", date: "Nov 15", split: "Exact amount", amount: "Rs. 3,200.00", badge: "Food", badgeColor: "bg-[#F3E8FF] text-[#8B5CF6]" },
];

export function ProductPreviewSection() {
  const [tab, setTab] = useState<PreviewTab>("dashboard");

  return (
    <section id="preview" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF7ED] px-3 py-1 text-xs font-bold text-[#079B76]">
            <LayoutDashboard className="h-3.5 w-3.5" /> Live Workspace Preview
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#102B35] sm:text-4xl">
            Everything Your Household Needs in One Clear View
          </h2>
          <p className="mt-3 text-base text-[#64748B]">
            See total spending, member balances, recent transactions and smart settlement
            suggestions without digging through spreadsheets.
          </p>

          {/* Interactive View Tabs */}
          <div className="mt-7 inline-flex flex-wrap justify-center gap-1.5 rounded-2xl border border-[#DCE8E4] bg-[#F7FAF9] p-1.5">
            {[
              { id: "dashboard", label: "Dashboard Overview", icon: LayoutDashboard },
              { id: "splits", label: "Splits & Balances", icon: Scale },
              { id: "reports", label: "Monthly Reports", icon: PieChart },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as PreviewTab)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all sm:text-sm ${
                  tab === t.id
                    ? "bg-white text-[#102B35] shadow-sm ring-1 ring-[#DCE8E4]"
                    : "text-[#64748B] hover:text-[#102B35]"
                }`}
              >
                <t.icon className={`h-4 w-4 ${tab === t.id ? "text-[#079B76]" : ""}`} />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Realistic Application Frame */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-[#D4E2DD] bg-[#F7FAF9] shadow-2xl shadow-[#102B35]/10">
          {/* App Top Browser Bar */}
          <div className="flex items-center justify-between border-b border-[#DCE8E4] bg-white px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#FCA5A5]" />
              <span className="h-3 w-3 rounded-full bg-[#FCD34D]" />
              <span className="h-3 w-3 rounded-full bg-[#6EE7B7]" />
              <span className="ml-3 hidden rounded-lg bg-[#F7FAF9] px-3 py-1 text-xs font-medium text-[#64748B] sm:inline-block">
                family-expense-tracker · /dashboard
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#DDF7ED] px-2.5 py-1 text-[11px] font-bold text-[#079B76]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#079B76]" /> Sample household data
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[220px_1fr]">
            {/* App Sidebar */}
            <aside className="hidden flex-col justify-between bg-[#102B35] p-5 text-white lg:flex">
              <div>
                <div className="flex items-center gap-2.5 pb-6">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#079B76]">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-sm font-bold leading-tight">Family Expense</div>
                </div>
                <div className="space-y-1 text-xs font-semibold">
                  {[
                    { label: "Dashboard", icon: LayoutDashboard, active: tab === "dashboard" },
                    { label: "Expenses", icon: Receipt, active: false },
                    { label: "Balances", icon: Scale, active: tab === "splits" },
                    { label: "Settlements", icon: Handshake, active: false },
                    { label: "Members", icon: Users, active: false },
                    { label: "Reports", icon: BarChart3, active: tab === "reports" },
                  ].map((nav) => (
                    <div
                      key={nav.label}
                      className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${
                        nav.active
                          ? "bg-[#079B76] text-white"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <nav.icon className="h-4 w-4" />
                      {nav.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-white/10 p-3 text-xs">
                <div className="font-bold text-white">Household Group</div>
                <div className="mt-0.5 text-white/70">4 active members · NPR</div>
              </div>
            </aside>

            {/* Main App Workspace */}
            <div className="p-5 sm:p-7">
              {/* Header inside App */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-[#102B35] sm:text-xl">
                    {tab === "dashboard"
                      ? "Household Overview"
                      : tab === "splits"
                        ? "Flexible Splits & Member Balances"
                        : "Monthly Reports & Category Breakdown"}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    {tab === "dashboard"
                      ? "Real-time summary across all family members"
                      : tab === "splits"
                        ? "Split equally, by exact amounts, percentages or one person"
                        : "Filter by date range and export CSV reports"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE8E4] bg-white px-3 py-1.5 text-xs font-semibold text-[#102B35]">
                    <Handshake className="h-3.5 w-3.5 text-[#079B76]" /> Settle up
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#079B76] px-3 py-1.5 text-xs font-semibold text-white">
                    <Plus className="h-3.5 w-3.5" /> Add expense
                  </span>
                </div>
              </div>

              {/* 4 Required KPI Cards */}
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[#DCE8E4] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                    Total Expenses
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#DDF7ED] text-[#079B76]">
                      <Wallet className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="tabular mt-2 text-xl font-extrabold text-[#102B35]">
                    Rs. 35,844.00
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-[#079B76]">
                    Across 4 active members
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DCE8E4] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                    This Month
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E7F0FF] text-[#2563EB]">
                      <Calendar className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="tabular mt-2 text-xl font-extrabold text-[#102B35]">
                    Rs. 12,450.00
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-[#64748B]">
                    9 shared expenses recorded
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DCE8E4] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                    This Week
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#8B5CF6]">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="tabular mt-2 text-xl font-extrabold text-[#102B35]">
                    Rs. 4,180.00
                  </div>
                  <div className="mt-1 text-[11px] font-medium text-[#64748B]">
                    Mostly groceries & dining
                  </div>
                </div>

                <div className="rounded-2xl border border-[#DCE8E4] bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#64748B]">
                    Top Spender
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEF3C7] text-[#D97706]">
                      <Sparkles className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="mt-2 text-xl font-extrabold text-[#102B35]">Kushal</div>
                  <div className="tabular mt-1 text-[11px] font-semibold text-[#079B76]">
                    Paid Rs. 15,200.00
                  </div>
                </div>
              </div>

              {/* Tab-Specific Panels */}
              {tab === "dashboard" && (
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_1fr]">
                  {/* Recent Expenses */}
                  <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#102B35]">Recent expenses</h4>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#079B76]">
                        View all <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {RECENT_EXPENSES_SAMPLE.map((item) => (
                        <div
                          key={item.title}
                          className="flex items-center justify-between gap-3 rounded-xl border border-[#F1F5F4] bg-[#FAFDFC] px-3.5 py-2.5"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-xs font-bold text-[#102B35] sm:text-sm">
                                {item.title}
                              </span>
                              <span
                                className={`hidden rounded-md px-2 py-0.5 text-[10px] font-bold sm:inline-block ${item.badgeColor}`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <div className="mt-0.5 text-[11px] text-[#64748B]">
                              {item.payer} paid · {item.date} · {item.split}
                            </div>
                          </div>
                          <div className="tabular shrink-0 text-xs font-extrabold text-[#102B35] sm:text-sm">
                            {item.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Member Balances + Settlement Summary */}
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                      <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-sm font-bold text-[#102B35]">Member balances</h4>
                        <span className="text-xs font-semibold text-[#079B76]">Details →</span>
                      </div>
                      <div className="space-y-3.5">
                        {MEMBERS_SAMPLE.map((m) => (
                          <div key={m.name}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white ${m.bg}`}
                                >
                                  {m.initials}
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#102B35]">{m.name}</div>
                                  <div className="text-[10px] text-[#64748B]">Paid {m.paid}</div>
                                </div>
                              </div>
                              <div
                                className={`tabular text-xs font-extrabold ${
                                  m.status === "owed"
                                    ? "text-[#079B76]"
                                    : m.status === "owes"
                                      ? "text-[#DC2626]"
                                      : "text-[#64748B]"
                                }`}
                              >
                                {m.status === "owed"
                                  ? `Owed ${m.net}`
                                  : m.status === "owes"
                                    ? `Owes ${m.net}`
                                    : "Settled"}
                              </div>
                            </div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#F1F5F4]">
                              <div
                                className={`h-full rounded-full ${
                                  m.status === "owed"
                                    ? "bg-[#079B76]"
                                    : m.status === "owes"
                                      ? "bg-[#F87171]"
                                      : "bg-[#CBD5E1]"
                                }`}
                                style={{ width: `${m.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settlement Summary */}
                    <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#079B76]" />
                        <h4 className="text-sm font-bold text-[#102B35]">Settlement summary</h4>
                      </div>
                      <div className="space-y-2.5">
                        {[
                          { from: "Aarav", to: "Kushal", amount: "Rs. 4,580.00" },
                          { from: "Maya", to: "Kushal", amount: "Rs. 3,650.00" },
                        ].map((s) => (
                          <div
                            key={s.from}
                            className="flex items-center justify-between rounded-xl border border-[#EDF3F1] bg-[#F7FAF9] px-3 py-2"
                          >
                            <div>
                              <div className="text-xs font-bold text-[#102B35]">
                                {s.from} → {s.to}
                              </div>
                              <div className="tabular text-xs font-extrabold text-[#079B76]">
                                {s.amount}
                              </div>
                            </div>
                            <span className="rounded-lg bg-[#DDF7ED] px-2.5 py-1 text-[11px] font-bold text-[#079B76]">
                              Settle
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {tab === "splits" && (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-[#102B35]">Supported Split Methods</h4>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Every share adds up automatically with zero rounding errors.
                    </p>
                    <div className="mt-4 space-y-2.5">
                      {[
                        {
                          mode: "Equal Split",
                          desc: "Divide any bill evenly across selected household members.",
                          badge: "Default",
                        },
                        {
                          mode: "Exact Amounts",
                          desc: "Specify exact Rupee amounts for each person.",
                          badge: "Flexible",
                        },
                        {
                          mode: "Percentages (%)",
                          desc: "Split rent or utilities by custom household share.",
                          badge: "Custom %",
                        },
                        {
                          mode: "Single Person",
                          desc: "Record an expense paid on behalf of one specific member.",
                          badge: "1-to-1",
                        },
                      ].map((item) => (
                        <div
                          key={item.mode}
                          className="flex items-start justify-between gap-3 rounded-xl border border-[#F1F5F4] bg-[#FAFDFC] p-3"
                        >
                          <div>
                            <div className="text-xs font-bold text-[#102B35]">{item.mode}</div>
                            <div className="mt-0.5 text-[11px] text-[#64748B]">{item.desc}</div>
                          </div>
                          <span className="shrink-0 rounded-lg bg-[#DDF7ED] px-2 py-0.5 text-[10px] font-bold text-[#079B76]">
                            {item.badge}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-[#102B35]">
                      Member Balances & eSewa Ready
                    </h4>
                    <p className="mt-1 text-xs text-[#64748B]">
                      Suggested settlements minimize the number of payments required.
                    </p>
                    <div className="mt-4 space-y-3">
                      {MEMBERS_SAMPLE.map((m) => (
                        <div
                          key={m.name}
                          className="flex items-center justify-between rounded-xl border border-[#F1F5F4] bg-[#FAFDFC] px-3.5 py-2.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white ${m.bg}`}
                            >
                              {m.initials}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#102B35]">{m.name}</div>
                              <div className="text-[10px] text-[#64748B]">Paid {m.paid}</div>
                            </div>
                          </div>
                          <span
                            className={`tabular text-xs font-extrabold ${
                              m.status === "owed"
                                ? "text-[#079B76]"
                                : m.status === "owes"
                                  ? "text-[#DC2626]"
                                  : "text-[#64748B]"
                            }`}
                          >
                            {m.net}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tab === "reports" && (
                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-[#102B35]">
                          Category-wise Spending
                        </h4>
                        <p className="text-xs text-[#64748B]">Clear household breakdown</p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#DCE8E4] px-2.5 py-1 text-[11px] font-semibold text-[#102B35]">
                        <Download className="h-3 w-3 text-[#079B76]" /> Export CSV
                      </span>
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        { label: "Rent & Housing", share: 50, amt: "Rs. 18,000.00", color: "bg-[#8B5CF6]" },
                        { label: "Groceries", share: 24, amt: "Rs. 8,600.00", color: "bg-[#079B76]" },
                        { label: "Electricity & Internet", share: 15, amt: "Rs. 5,244.00", color: "bg-[#2563EB]" },
                        { label: "Food & Dining", share: 11, amt: "Rs. 4,000.00", color: "bg-[#F59E0B]" },
                      ].map((c) => (
                        <div key={c.label}>
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#102B35]">{c.label}</span>
                            <span className="tabular font-bold text-[#102B35]">
                              {c.amt}{" "}
                              <span className="font-normal text-[#64748B]">({c.share}%)</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#F1F5F4]">
                            <div
                              className={`h-full rounded-full ${c.color}`}
                              style={{ width: `${c.share}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#DCE8E4] bg-white p-5 shadow-xs">
                    <h4 className="text-sm font-bold text-[#102B35]">Paid vs Share per Member</h4>
                    <p className="mt-0.5 text-xs text-[#64748B]">
                      Track each member&apos;s monthly contribution
                    </p>
                    <div className="mt-5 flex h-44 items-end justify-around gap-4 border-b border-[#EDF3F1] pb-2">
                      {[
                        { name: "Kushal", paidH: "h-36", shareH: "h-20" },
                        { name: "Sareena", paidH: "h-20", shareH: "h-20" },
                        { name: "Aarav", paidH: "h-14", shareH: "h-24" },
                        { name: "Maya", paidH: "h-12", shareH: "h-20" },
                      ].map((bar) => (
                        <div key={bar.name} className="flex flex-col items-center gap-2">
                          <div className="flex items-end gap-1.5">
                            <div className={`w-4 rounded-t-md bg-[#079B76] ${bar.paidH}`} />
                            <div className={`w-4 rounded-t-md bg-[#8B5CF6]/75 ${bar.shareH}`} />
                          </div>
                          <span className="text-[11px] font-semibold text-[#64748B]">
                            {bar.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-5 text-[11px] font-semibold text-[#64748B]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-xs bg-[#079B76]" /> Total Paid
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-xs bg-[#8B5CF6]/75" /> Fair Share
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
