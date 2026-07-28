import { useRef } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Check,
  LayoutGrid,
  Receipt,
  Send,
  Wallet,
} from "lucide-react";
import { NexaLogo } from "@/components/NexaLogo";
import { Sparkline } from "@/components/ui/sparkline";
import { TrendBadge } from "@/components/ui/trend";
import { cn } from "@/lib/utils";
import { currency } from "@/lib/format";

const BALANCE_SERIES = [
  31200, 30840, 31980, 31460, 33110, 34020, 33580, 35240, 36110, 35720, 37480, 38260, 37910, 39640, 41020, 40580,
  42310, 43870, 43220, 45090, 46340, 45880, 47120, 48204,
];

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutGrid, active: true },
  { label: "Accounts", icon: Wallet },
  { label: "Transactions", icon: Receipt },
  { label: "Move money", icon: ArrowLeftRight },
];

const ACCOUNTS = [
  { name: "Everyday Checking", mask: "•••• 4821", balance: 12840.55, color: "bg-primary" },
  { name: "Savings", mask: "•••• 7310", balance: 35363.64, color: "bg-credit" },
];

const ACTIVITY = [
  { label: "Payroll deposit", meta: "Today, 9:42 AM", amount: 2400, kind: "in" as const },
  { label: "Sent to @maya", meta: "Yesterday, 4:18 PM", amount: -180, kind: "out" as const },
  { label: "ATM withdrawal", meta: "Jul 22, 11:06 AM", amount: -95, kind: "out" as const },
  { label: "Savings transfer", meta: "Jul 20, 8:30 AM", amount: -620, kind: "out" as const },
];

export function ProductPreview({ className }: { className?: string }) {
  const previewRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!previewRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = previewRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    previewRef.current.style.transform = `perspective(1600px) rotateX(${-y * 2.2}deg) rotateY(${x * 3.2}deg) translateZ(0)`;
  };

  const resetTilt = () => {
    if (previewRef.current) {
      previewRef.current.style.transform = "perspective(1600px) rotateX(0deg) rotateY(0deg) translateZ(0)";
    }
  };

  return (
    <div
      className={cn("product-stage relative", className)}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
    >
      <div className="product-stage-lines pointer-events-none absolute inset-x-10 -inset-y-6" aria-hidden="true" />

      <div
        ref={previewRef}
        className="product-window relative overflow-hidden rounded-lg border border-border bg-card shadow-lg transition-transform duration-300 ease-out"
      >
        <div className="flex h-11 items-center border-b border-border bg-muted/45 px-4">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-destructive/70" />
            <span className="h-2 w-2 rounded-full bg-warning/70" />
            <span className="h-2 w-2 rounded-full bg-credit/70" />
          </div>
          <div className="mx-auto flex h-6 w-48 items-center justify-center rounded-md border border-border bg-background/70 text-[10px] text-muted-foreground">
            secure.nexa.app/dashboard
          </div>
          <div className="w-[50px]" />
        </div>

        <div className="grid min-h-[560px] md:grid-cols-[172px_minmax(0,1fr)]">
          <aside className="hidden border-r border-border bg-background/55 p-4 md:flex md:flex-col">
            <NexaLogo size="sm" />

            <nav className="mt-8 space-y-1">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium",
                    item.active ? "bg-accent text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {item.label}
                </div>
              ))}
            </nav>

            <div className="mt-auto border-t border-border pt-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-muted text-[9px] font-bold text-primary">
                  JE
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px] font-semibold">Jordan Ellis</span>
                  <span className="block truncate text-[9px] text-muted-foreground">@jordan</span>
                </span>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold">Overview</p>
                <p className="text-[9px] text-muted-foreground">Saturday, July 25</p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground">
                <Bell className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden="true" />
              </span>
            </header>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_250px]">
              <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Total balance</p>
                    <p className="tabular mt-1 text-[2.15rem] font-semibold leading-none tracking-[-0.04em] sm:text-[2.7rem]">
                      $48,204<span className="text-xl text-muted-foreground">.19</span>
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">Across 2 active accounts</p>
                  </div>
                  <TrendBadge value={0.024} label="30d" />
                </div>

                <div className="mt-5 h-32 border-b border-border pb-4 sm:h-40">
                  <Sparkline data={BALANCE_SERIES} showEndDot strokeWidth={2} />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Recent activity</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">Latest movements across your accounts</p>
                  </div>
                  <span className="text-[10px] font-medium text-primary">View all</span>
                </div>

                <div className="mt-3 divide-y divide-border">
                  {ACTIVITY.map((item) => (
                    <div key={item.label} className="flex items-center gap-3 py-2.5">
                      <span
                        className={cn(
                          "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                          item.kind === "in" ? "bg-credit-muted text-credit" : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.kind === "in" ? (
                          <ArrowDownLeft className="h-3.5 w-3.5" strokeWidth={2.1} />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-medium">{item.label}</span>
                        <span className="block truncate text-[9px] text-muted-foreground">{item.meta}</span>
                      </span>
                      <span
                        className={cn(
                          "tabular text-[11px] font-semibold",
                          item.kind === "in" ? "text-credit" : "text-foreground",
                        )}
                      >
                        {item.kind === "in" ? "+" : "−"}
                        {currency(Math.abs(item.amount))}
                      </span>
                    </div>
                  ))}
                </div>
              </main>

              <aside className="border-t border-border bg-background/35 p-4 sm:p-5 lg:border-l lg:border-t-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold">Accounts</p>
                  <span className="text-[10px] text-primary">Manage</span>
                </div>

                <div className="mt-3 divide-y divide-border border-y border-border">
                  {ACCOUNTS.map((account) => (
                    <div key={account.mask} className="py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("h-1.5 w-1.5 rounded-full", account.color)} />
                        <p className="truncate text-[10px] font-medium">{account.name}</p>
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between gap-3">
                        <p className="text-[9px] text-muted-foreground">{account.mask}</p>
                        <p className="tabular text-xs font-semibold">{currency(account.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <button type="button" tabIndex={-1} className="btn btn-primary btn-sm pointer-events-none mt-4 w-full text-[11px]">
                  <Send className="h-3.5 w-3.5" />
                  Send money
                </button>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground">This month</p>
                  <dl className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <dt className="text-muted-foreground">Money in</dt>
                      <dd className="tabular font-semibold text-credit">+$4,820.00</dd>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <dt className="text-muted-foreground">Money out</dt>
                      <dd className="tabular font-semibold">$2,146.70</dd>
                    </div>
                  </dl>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="transfer-toast absolute -bottom-5 right-4 hidden items-center gap-3 rounded-lg border border-border bg-popover px-3.5 py-3 shadow-lg sm:flex lg:right-10">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-credit-muted text-credit">
          <Check className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
        </span>
        <span>
          <span className="block text-xs font-semibold">Transfer complete</span>
          <span className="block text-[10px] text-muted-foreground">$180.00 sent to @maya</span>
        </span>
      </div>
    </div>
  );
}

export default ProductPreview;
