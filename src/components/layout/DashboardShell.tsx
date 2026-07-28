import { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeftRight, LayoutGrid, LogOut, Receipt, RefreshCw, Wallet,
  CreditCard, AlertCircle, Globe, Bell, PiggyBank, CalendarClock,
  Target, HeadphonesIcon, Users, BarChart3, FileText, User,
} from "lucide-react";
import { NexaLogo } from "@/components/NexaLogo";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

export type DashboardTab =
  | "overview" | "accounts" | "transactions" | "move-money"
  | "cards" | "disputes" | "payment-rails" | "payment-requests"
  | "budgets" | "support" | "beneficiaries" | "notifications"
  | "scheduled-payments" | "savings-goals" | "statements" | "profile";

export const TABS: { id: DashboardTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "accounts", label: "Accounts", icon: Wallet },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "move-money", label: "Move money", icon: ArrowLeftRight },
  { id: "cards", label: "Cards", icon: CreditCard },
  { id: "disputes", label: "Disputes", icon: AlertCircle },
  { id: "payment-rails", label: "External transfers", icon: Globe },
  { id: "payment-requests", label: "Pay requests", icon: BarChart3 },
  { id: "budgets", label: "Budgets", icon: PiggyBank },
  { id: "savings-goals", label: "Savings goals", icon: Target },
  { id: "scheduled-payments", label: "Scheduled", icon: CalendarClock },
  { id: "beneficiaries", label: "Beneficiaries", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "support", label: "Support", icon: HeadphonesIcon },
  { id: "statements", label: "Statements", icon: FileText },
  { id: "profile", label: "Profile", icon: User },
];

interface DashboardShellProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  user: { fullName?: string; username?: string } | null;
  onRefresh: () => void;
  refreshing?: boolean;
  onSignOut: () => void;
  children: ReactNode;
}

export function DashboardShell({
  activeTab,
  onTabChange,
  user,
  onRefresh,
  refreshing = false,
  onSignOut,
  children,
}: DashboardShellProps) {
  const displayName = user?.fullName || user?.username || "Your account";

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop sidebar ── */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/" className="rounded-md" aria-label="Nexa home">
            <NexaLogo size="md" />
          </Link>
        </div>

        <nav className="relative flex-1 space-y-1 px-3 py-2">
          {/* Sliding indicator */}
          <div
            className="absolute left-3 right-3 h-[36px] rounded-lg bg-accent transition-all duration-300 ease-out"
            style={{
              top: `calc(0.5rem + ${TABS.findIndex((t) => t.id === activeTab) * 40}px)`,
            }}
            aria-hidden="true"
          />

          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
              className={cn(
                "nav-item relative z-10 w-full",
                activeTab === tab.id ? "text-foreground font-semibold" : "hover:bg-transparent hover:text-foreground"
              )}
            >
              <tab.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.85} aria-hidden="true" />
              {tab.label}
              
              {/* Left rail marker for active state */}
              {activeTab === tab.id && (
                <div className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
              )}
            </button>
          ))}
        </nav>

        <div className="space-y-1 border-t border-border p-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="nav-item w-full disabled:opacity-60"
          >
            <RefreshCw
              className={cn("h-[18px] w-[18px] shrink-0", refreshing && "animate-spin")}
              strokeWidth={1.85}
              aria-hidden="true"
            />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button type="button" onClick={onSignOut} className="nav-item w-full">
            <LogOut className="h-[18px] w-[18px] shrink-0" strokeWidth={1.85} aria-hidden="true" />
            Sign out
          </button>

          <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-border bg-background p-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-muted text-[11px] font-semibold text-primary">
              {initials(displayName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium text-foreground">{displayName}</span>
              {user?.username && (
                <span className="block truncate text-[11px] text-muted-foreground">@{user.username}</span>
              )}
            </span>
            <ThemeToggle className="h-7 w-7" />
          </div>
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-[248px]">
        {/* Mobile header + tab strip */}
        <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl md:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link to="/" className="rounded-md" aria-label="Nexa home">
              <NexaLogo size="sm" />
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
              >
                <RefreshCw className={cn("h-[18px] w-[18px]", refreshing && "animate-spin")} strokeWidth={1.85} />
              </button>
              <ThemeToggle />
              <button
                type="button"
                onClick={onSignOut}
                aria-label="Sign out"
                className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </button>
            </div>
          </div>

          <div className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={activeTab === tab.id ? "page" : undefined}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8 lg:px-10">
          <div className="mx-auto w-full max-w-[1100px]">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default DashboardShell;
