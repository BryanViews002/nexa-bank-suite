import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, Download, Landmark, Plus, Receipt, Send, Wallet, X } from "lucide-react";

import { DashboardShell, DashboardTab } from "@/components/layout/DashboardShell";
import { AccountManagement } from "@/components/dashboard/account-management";
import { MoveMoney } from "@/components/dashboard/move-money";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { TransactionFilters, FilterState } from "@/components/dashboard/transaction-filters";
import { BalanceChart, BalancePoint } from "@/components/charts/balance-chart";
import { CardsPanel } from "@/components/dashboard/cards-panel";
import { DisputesPanel } from "@/components/dashboard/disputes-panel";
import { PaymentRailsPanel } from "@/components/dashboard/payment-rails-panel";
import { PaymentRequestsPanel } from "@/components/dashboard/payment-requests-panel";
import { BudgetsPanel } from "@/components/dashboard/budgets-panel";
import { SupportPanel } from "@/components/dashboard/support-panel";
import { BeneficiariesPanel } from "@/components/dashboard/beneficiaries-panel";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { ScheduledPaymentsPanel } from "@/components/dashboard/scheduled-payments-panel";
import { SavingsGoalsPanel } from "@/components/dashboard/savings-goals-panel";
import { StatementsPanel } from "@/components/dashboard/statements-panel";
import { ProfilePanel } from "@/components/dashboard/profile-panel";

import { BalanceDisplay } from "@/components/ui/money";
import { Sparkline } from "@/components/ui/sparkline";
import { TrendBadge } from "@/components/ui/trend";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardSkeleton } from "@/components/ui/loading-skeleton";

import { useToast } from "@/hooks/use-toast";
import { apiUrl, readApiError, withCredentials } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  currency,
  dateGroupLabel,
  firstName,
  formatDate,
  isCredit,
  maskAccount,
  signedAmount,
  titleCase,
} from "@/lib/format";

interface Account {
  accountId: number;
  userId: number;
  balance: number;
  accountType: string;
}

interface Transaction {
  transactionId: number;
  accountId: number;
  amount: number;
  type: string;
  date: string;
}

interface UserSession {
  username: string;
  fullName: string;
}

const RANGES = [
  { days: 7, label: "7D" },
  { days: 30, label: "30D" },
  { days: 90, label: "90D" },
] as const;

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

/**
 * Reconstructs a daily closing-balance series from real transaction history.
 *
 * The only balance the API gives us is the current one, so we walk backwards:
 * today's closing balance is the sum of account balances, and each earlier day
 * is the following day's closing balance minus that day's net movement. This
 * is exact for any period the transaction list fully covers.
 */
function buildBalanceSeries(totalBalance: number, transactions: Transaction[], days: number): BalancePoint[] {
  const netByDay = new Map<string, number>();

  for (const txn of transactions) {
    const date = new Date(txn.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = dayKey(date);
    netByDay.set(key, (netByDay.get(key) ?? 0) + signedAmount(txn.type, txn.amount));
  }

  const series: BalancePoint[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  let running = totalBalance;

  for (let i = 0; i < days; i++) {
    series.push({
      date: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      balance: Math.round(running * 100) / 100,
    });
    // Undo this day's movements to land on the previous day's closing balance.
    running -= netByDay.get(dayKey(cursor)) ?? 0;
    cursor.setDate(cursor.getDate() - 1);
  }

  return series.reverse();
}

const Dashboard = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [userSession, setUserSession] = useState<UserSession | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [rangeDays, setRangeDays] = useState<number>(30);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
    fetchUserSession();
  }, []);

  const fetchUserSession = async () => {
    try {
      // Try /users/me first, then fall back to /user/profile
      let response = await fetch(apiUrl("/api/v1/profile"), withCredentials);
      if (!response.ok) response = await fetch(apiUrl("/api/v1/users/me"), withCredentials);
      if (response.ok) {
        const data = await response.json();
        // Normalize field names — backend may return username/fullName or full_name
        setUserSession({
          username: data.username,
          fullName: data.fullName ?? data.full_name ?? data.name ?? data.username,
        });
      }
    } catch {
      // Non-fatal: the dashboard renders without a display name.
    }
  };

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const accountsResponse = await fetch(apiUrl("/api/v1/accounts"), withCredentials);

      if (!accountsResponse.ok) {
        if (accountsResponse.status === 401) {
          navigate("/login");
          return;
        }
        const apiError = await readApiError(accountsResponse, "Failed to fetch accounts");
        if (accountsResponse.status === 403 && apiError.code === "KYC_REQUIRED") {
          navigate("/kyc");
          return;
        }
        throw new Error(apiError.message);
      }

      const accountsRaw = await accountsResponse.json();
      // Backend may return `id` instead of `accountId` — normalize to one shape.
      const accountsData: Account[] = (Array.isArray(accountsRaw) ? accountsRaw : []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => ({
          accountId: a.accountId ?? a.id,
          userId: a.userId ?? a.user_id,
          balance: a.balance,
          accountType: a.accountType ?? a.type,
        })
      );
      setAccounts(accountsData);
      setError("");

      const transactionsResponse = await fetch(apiUrl("/api/v1/transactions"), withCredentials);

      if (transactionsResponse.ok) {
        const transactionsRaw = await transactionsResponse.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transactionsData: Transaction[] = (Array.isArray(transactionsRaw) ? transactionsRaw : []).map((t: any) => ({
          transactionId: t.transactionId ?? t.id,
          accountId: t.accountId ?? t.account_id,
          amount: t.amount,
          type: t.type,
          date: t.date ?? t.createdAt ?? t.created_at,
        }));
        setTransactions(transactionsData);
        setFilteredTransactions(transactionsData);
      } else if (transactionsResponse.status === 403) {
        const apiError = await readApiError(transactionsResponse, "Failed to fetch transactions");
        if (apiError.code === "KYC_REQUIRED") {
          navigate("/kyc");
          return;
        }
      }
    } catch {
      setError("We couldn't load your accounts. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const response = await fetch(apiUrl("/api/v1/auth/logout"), { method: "POST", credentials: "include" });
      if (response.ok) {
        localStorage.clear();
        toast({ title: "Signed out", description: "Your session has ended." });
        navigate("/login");
      }
    } catch {
      toast({
        title: "Couldn't sign out",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  const applyFilters = (filters: FilterState) => {
    let filtered = [...transactions];

    if (filters.search) {
      const term = filters.search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.transactionId.toString().includes(term) ||
          t.accountId.toString().includes(term) ||
          t.type.toLowerCase().includes(term),
      );
    }

    if (filters.type !== "all") {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    if (filters.dateRange !== "all") {
      const now = new Date();
      const startDate = new Date();
      switch (filters.dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          startDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      filtered = filtered.filter((t) => new Date(t.date) >= startDate);
    }

    if (filters.amountMin) filtered = filtered.filter((t) => t.amount >= parseFloat(filters.amountMin));
    if (filters.amountMax) filtered = filtered.filter((t) => t.amount <= parseFloat(filters.amountMax));

    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (filters.sortBy) {
        case "amount":
          aValue = a.amount;
          bValue = b.amount;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "account":
          aValue = a.accountId;
          bValue = b.accountId;
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }

      if (filters.sortOrder === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    setFilteredTransactions(filtered);
  };

  const totalBalance = useMemo(() => accounts.reduce((sum, acc) => sum + acc.balance, 0), [accounts]);

  const chartData = useMemo(
    () => buildBalanceSeries(totalBalance, transactions, rangeDays),
    [totalBalance, transactions, rangeDays],
  );

  const trend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].balance;
    const last = chartData[chartData.length - 1].balance;
    if (first === 0) return last === 0 ? 0 : 1;
    return (last - first) / Math.abs(first);
  }, [chartData]);

  const monthStats = useMemo(() => {
    const now = new Date();
    const inMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const moneyIn = inMonth.filter((t) => isCredit(t.type)).reduce((s, t) => s + t.amount, 0);
    const moneyOut = inMonth.filter((t) => !isCredit(t.type)).reduce((s, t) => s + t.amount, 0);

    return { count: inMonth.length, moneyIn, moneyOut };
  }, [transactions]);

  const recentTransactions = useMemo(
    () =>
      [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [transactions],
  );

  /** Exports exactly what the current filters produced, not the full ledger. */
  const exportCsv = () => {
    const header = ["Reference", "Date", "Account", "Type", "Amount"];
    const rows = filteredTransactions.map((t) => [
      t.transactionId,
      new Date(t.date).toISOString(),
      t.accountId,
      t.type,
      signedAmount(t.type, t.amount).toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexa-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export ready", description: `${filteredTransactions.length} transactions downloaded.` });
  };

  const shellProps = {
    activeTab,
    onTabChange: setActiveTab,
    user: userSession,
    onRefresh: fetchDashboardData,
    refreshing,
    onSignOut: handleSignOut,
  };

  if (loading) {
    return (
      <DashboardShell {...shellProps}>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell {...shellProps}>
      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Dismiss"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ═══════════════ Overview ═══════════════ */}
      {activeTab === "overview" && (
        <div className="animate-fade-up space-y-6">
          <PageHeader
            // Drop the name rather than greet an anonymous "there" — the
            // profile call can still be in flight on first paint.
            title={
              firstName(userSession?.fullName)
                ? `Good to see you, ${firstName(userSession?.fullName)}`
                : "Good to see you"
            }
            description="Here's where your money stands today."
            actions={
              <button type="button" onClick={() => setActiveTab("move-money")} className="btn btn-primary btn-sm">
                <Send className="h-4 w-4" />
                Send money
              </button>
            }
          />

          {accounts.length === 0 ? (
            <div className="surface">
              <EmptyState
                icon={Landmark}
                title="You don't have any accounts yet"
                description="Open a checking or savings account to start moving money."
                action={
                  <button type="button" onClick={() => setActiveTab("accounts")} className="btn btn-primary btn-sm">
                    <Plus className="h-4 w-4" />
                    Open an account
                  </button>
                }
              />
            </div>
          ) : (
            <>
              {/* Balance + this month */}
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="surface relative overflow-hidden p-6 lg:col-span-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total balance</p>
                      <BalanceDisplay value={totalBalance} size="lg" className="mt-1.5" />
                      <p className="mt-1.5 text-[13px] text-muted-foreground">
                        Across {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
                      </p>
                    </div>
                    <TrendBadge value={trend} label={`${rangeDays}d`} />
                  </div>

                  <div className="pointer-events-none mt-5 h-16 opacity-90">
                    <Sparkline data={chartData.map((d) => d.balance)} showEndDot />
                  </div>
                </div>

                <div className="surface p-6">
                  <p className="text-sm text-muted-foreground">This month</p>

                  <dl className="mt-4 space-y-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-[13px] text-muted-foreground">Money in</dt>
                      <dd className="tabular text-lg font-semibold text-credit">
                        +{currency(monthStats.moneyIn)}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-[13px] text-muted-foreground">Money out</dt>
                      <dd className="tabular text-lg font-semibold">−{currency(monthStats.moneyOut)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t border-border pt-4">
                      <dt className="text-[13px] text-muted-foreground">Transactions</dt>
                      <dd className="tabular text-lg font-semibold">{monthStats.count}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Balance history */}
              <div className="surface p-5 sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">Balance history</h2>
                    <p className="mt-0.5 text-[13px] text-muted-foreground">
                      Reconstructed from your transaction history.
                    </p>
                  </div>

                  <div className="flex gap-1 rounded-lg border border-border p-1">
                    {RANGES.map((range) => (
                      <button
                        key={range.days}
                        type="button"
                        onClick={() => setRangeDays(range.days)}
                        aria-pressed={rangeDays === range.days}
                        className={cn(
                          "rounded-md px-3 py-1 text-[13px] font-medium transition-colors",
                          rangeDays === range.days
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <BalanceChart data={chartData} />

                {transactions.length === 0 && (
                  <p className="mt-3 text-center text-[13px] text-muted-foreground">
                    No transactions yet, so the line reflects your current balance.
                  </p>
                )}
              </div>

              {/* Activity + accounts */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="surface flex flex-col p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold">Recent activity</h2>
                    {transactions.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("transactions")}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-primary underline-offset-4 hover:underline"
                      >
                        View all
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {recentTransactions.length > 0 ? (
                    <div className="-mx-2 divide-y divide-border">
                      {recentTransactions.map((txn) => (
                        <TransactionRow key={txn.transactionId} transaction={txn} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      size="sm"
                      icon={Receipt}
                      title="No transactions yet"
                      description="Your deposits, withdrawals and transfers will appear here."
                      action={
                        <button
                          type="button"
                          onClick={() => setActiveTab("move-money")}
                          className="btn btn-secondary btn-sm"
                        >
                          Move some money
                        </button>
                      }
                    />
                  )}
                </div>

                <div className="surface p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-base font-semibold">Your accounts</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab("accounts")}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Manage
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-border">
                    {accounts.map((account) => (
                      <div key={account.accountId} className="flex items-center gap-3 py-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-muted text-primary">
                          <Wallet className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{account.accountType}</p>
                          <p className="tabular truncate text-xs text-muted-foreground">
                            {maskAccount(account.accountId)}
                          </p>
                        </div>
                        <span className="tabular shrink-0 text-sm font-semibold">{currency(account.balance)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ Accounts ═══════════════ */}
      {activeTab === "accounts" && (
        <div className="animate-fade-up">
          <AccountManagement accounts={accounts} onAccountsUpdate={fetchDashboardData} />
        </div>
      )}

      {/* ═══════════════ Transactions ═══════════════ */}
      {activeTab === "transactions" && (
        <div className="animate-fade-up space-y-6">
          <PageHeader
            title="Transactions"
            description="Every movement across your accounts."
            actions={
              <button
                type="button"
                onClick={exportCsv}
                disabled={filteredTransactions.length === 0}
                className="btn btn-secondary btn-sm"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
            }
          />

          <TransactionFilters
            onFiltersChange={applyFilters}
            transactionCount={transactions.length}
            filteredCount={filteredTransactions.length}
          />

          {filteredTransactions.length === 0 ? (
            <div className="surface">
              <EmptyState
                icon={Receipt}
                title={transactions.length === 0 ? "No transactions yet" : "No matching transactions"}
                description={
                  transactions.length === 0
                    ? "Once you deposit, withdraw or send money, it'll show up here."
                    : "Try widening your date range or clearing the filters."
                }
                action={
                  transactions.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("move-money")}
                      className="btn btn-primary btn-sm"
                    >
                      Move some money
                    </button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              {/* Table on wide screens, grouped list on narrow — a four-column
                  table doesn't survive a phone, and horizontal scroll is worse
                  than a purpose-built layout. */}
              <div className="surface hidden overflow-hidden sm:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th scope="col" className="px-5 py-3 text-[13px] font-medium text-muted-foreground">
                        Type
                      </th>
                      <th scope="col" className="px-5 py-3 text-[13px] font-medium text-muted-foreground">
                        Date
                      </th>
                      <th scope="col" className="px-5 py-3 text-[13px] font-medium text-muted-foreground">
                        Account
                      </th>
                      <th scope="col" className="px-5 py-3 text-[13px] font-medium text-muted-foreground">
                        Reference
                      </th>
                      <th
                        scope="col"
                        className="px-5 py-3 text-right text-[13px] font-medium text-muted-foreground"
                      >
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.map((transaction) => {
                      const credit = isCredit(transaction.type);

                      return (
                        <tr key={transaction.transactionId} className="transition-colors hover:bg-accent/40">
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-2 font-medium">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 shrink-0 rounded-full",
                                  credit ? "bg-credit" : "bg-muted-foreground/50",
                                )}
                                aria-hidden="true"
                              />
                              {titleCase(transaction.type)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground">{formatDate(transaction.date)}</td>
                          <td className="tabular px-5 py-3.5 text-muted-foreground">
                            {maskAccount(transaction.accountId)}
                          </td>
                          <td className="tabular px-5 py-3.5 text-muted-foreground">#{transaction.transactionId}</td>
                          <td
                            className={cn(
                              "tabular px-5 py-3.5 text-right font-semibold",
                              credit ? "text-credit" : "text-foreground",
                            )}
                          >
                            {credit ? "+" : "−"}
                            {currency(Math.abs(transaction.amount))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="space-y-5 sm:hidden">
                {Object.entries(
                  filteredTransactions.reduce<Record<string, Transaction[]>>((groups, txn) => {
                    const key = dateGroupLabel(txn.date);
                    (groups[key] ??= []).push(txn);
                    return groups;
                  }, {}),
                ).map(([group, items]) => (
                  <div key={group}>
                    <p className="mb-1.5 px-2 text-xs font-medium text-muted-foreground">{group}</p>
                    <div className="surface divide-y divide-border px-2">
                      {items.map((txn) => (
                        <TransactionRow key={txn.transactionId} transaction={txn} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════ Move money ═══════════════ */}
      {activeTab === "move-money" && (
        <div className="animate-fade-up space-y-6">
          <PageHeader title="Move money" description="Send, deposit, or withdraw from your accounts." />

          {accounts.length === 0 ? (
            <div className="surface">
              <EmptyState
                icon={Landmark}
                title="You need an account first"
                description="Open a checking or savings account before moving money."
                action={
                  <button type="button" onClick={() => setActiveTab("accounts")} className="btn btn-primary btn-sm">
                    <Plus className="h-4 w-4" />
                    Open an account
                  </button>
                }
              />
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <MoveMoney accounts={accounts} onComplete={fetchDashboardData} />

              <aside className="surface h-fit p-5">
                <h2 className="text-sm font-semibold">Available to move</h2>
                <div className="mt-3 divide-y divide-border">
                  {accounts.map((account) => (
                    <div key={account.accountId} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">{account.accountType}</p>
                        <p className="tabular truncate text-xs text-muted-foreground">
                          {maskAccount(account.accountId)}
                        </p>
                      </div>
                      <span className="tabular shrink-0 text-[13px] font-semibold">
                        {currency(account.balance)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[13px] text-muted-foreground">Total</span>
                  <span className="tabular text-sm font-semibold">{currency(totalBalance)}</span>
                </div>
              </aside>
            </div>
          )}
        </div>
      )}

      {activeTab === "cards" && <div className="animate-fade-up"><CardsPanel /></div>}
      {activeTab === "disputes" && <div className="animate-fade-up"><DisputesPanel /></div>}
      {activeTab === "payment-rails" && <div className="animate-fade-up"><PaymentRailsPanel /></div>}
      {activeTab === "payment-requests" && <div className="animate-fade-up"><PaymentRequestsPanel /></div>}
      {activeTab === "budgets" && <div className="animate-fade-up"><BudgetsPanel /></div>}
      {activeTab === "support" && <div className="animate-fade-up"><SupportPanel /></div>}
      {activeTab === "beneficiaries" && <div className="animate-fade-up"><BeneficiariesPanel /></div>}
      {activeTab === "notifications" && <div className="animate-fade-up"><NotificationsPanel /></div>}
      {activeTab === "scheduled-payments" && <div className="animate-fade-up"><ScheduledPaymentsPanel /></div>}
      {activeTab === "savings-goals" && <div className="animate-fade-up"><SavingsGoalsPanel /></div>}
      {activeTab === "statements" && <div className="animate-fade-up"><StatementsPanel /></div>}
      {activeTab === "profile" && <div className="animate-fade-up"><ProfilePanel /></div>}
    </DashboardShell>
  );
};

export default Dashboard;
