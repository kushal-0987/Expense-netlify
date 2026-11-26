import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, UserPlus, LogIn, Wallet, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNavbar({ signedIn }: { signedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#079B76]/10 bg-[#FFFFFF]/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand */}
        <a href="#home" className="group flex items-center gap-2.5 focus:outline-none">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#079B76] to-[#0CB88D] text-white shadow-sm shadow-[#079B76]/25 transition-transform duration-300 group-hover:scale-105">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-tight text-[#102B35]">
              Family Expense Tracker
            </div>
            <div className="text-[10px] font-semibold tracking-wider text-[#079B76] uppercase">
              Track · Split · Settle
            </div>
          </div>
        </a>

        {/* Centre: Navigation Links */}
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-1.5 text-sm font-medium text-[#64748B] transition-colors hover:bg-[#DDF7ED]/60 hover:text-[#102B35]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden items-center gap-2.5 lg:flex">
          {signedIn ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-[#079B76] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[#079B76]/25 transition-all hover:bg-[#068263] hover:shadow-md"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#DCE6E3] bg-white px-4 py-2 text-sm font-semibold text-[#102B35] transition-all hover:border-[#079B76]/40 hover:bg-[#F7FAF9]"
              >
                <LogIn className="h-3.5 w-3.5 text-[#64748B]" />
                Sign In
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#079B76] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#079B76]/25 transition-all hover:-translate-y-0.5 hover:bg-[#068263] hover:shadow-lg hover:shadow-[#079B76]/30"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE6E3] bg-white text-[#102B35] transition-colors hover:bg-[#F7FAF9] lg:hidden"
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile collapsible menu */}
      {mobileOpen && (
        <div className="border-t border-[#E2ECE9] bg-white px-4 pb-5 pt-3 shadow-lg lg:hidden">
          <nav className="flex flex-col space-y-1">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#102B35] transition-colors hover:bg-[#DDF7ED]/60"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2.5 border-t border-[#E2ECE9] pt-4">
            {signedIn ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#079B76] px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#DCE6E3] bg-white px-4 py-2.5 text-sm font-semibold text-[#102B35]"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#079B76] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#079B76]/25"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
