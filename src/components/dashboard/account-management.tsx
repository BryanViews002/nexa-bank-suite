import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Landmark, Loader2, PiggyBank, Plus, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { TransactionRow } from "@/components/dashboard/transaction-row";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, jsonPost, readApiError, withCredentials } from "@/lib/api";
import { cn } from "@/lib/utils";
import { currency, maskAccount } from "@/lib/format";

interface Account {
  accountId: number;
  balance: number;
  accountType: string;
}

interface Transaction {
  transactionId: number;
  amount: number;
  type: string;
  date: string;
}

interface AccountManagementProps {
  accounts: Account[];
  onAccountsUpdate: () => void;
}

const ACCOUNT_TYPES = [
  {
    value: "Checking",
    label: "Checking",
    description: "For everyday spending and transfers.",
    icon: Wallet,
  },
  {
    value: "Savings",
    label: "Savings",
    description: "Set money aside from your day-to-day balance.",
    icon: PiggyBank,
  },
];

const iconFor = (accountType: string) =>
  accountType?.toLowerCase() === "savings" ? PiggyBank : Wallet;

export function AccountManagement({ accounts, onAccountsUpdate }: AccountManagementProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAccountType, setNewAccountType] = useState("Checking");
  const [createError, setCreateError] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [statement, setStatement] = useState<Transaction[]>([]);
  const [statementLoading, setStatementLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccountType) return;

    setCreating(true);
    setCreateError("");

    try {
      const response = await fetch(apiUrl("/accounts/open"), jsonPost({ type: newAccountType }));

      if (response.ok) {
        toast({
          title: `${newAccountType} account opened`,
          description: "It's ready to use straight away.",
        });
        setNewAccountType("Checking");
        setShowCreateDialog(false);
        onAccountsUpdate();
      } else {
        const apiError = await readApiError(response, "We couldn't open that account. Please try again.");
        if (response.status === 403 && apiError.code === "KYC_REQUIRED") {
          navigate("/kyc");
          return;
        }
        setCreateError(apiError.message);
      }
    } catch {
      setCreateError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatement = async (accountId: number) => {
    if (expandedId === accountId) {
      setExpandedId(null);
      return;
    }

    // Open immediately and show a loading row — waiting on the request before
    // expanding makes the click feel unresponsive.
    setExpandedId(accountId);
    setStatement([]);
    setStatementLoading(true);

    try {
      const response = await fetch(apiUrl(`/accounts/${accountId}/mini-statement`), withCredentials);

      if (response.ok) {
        setStatement(await response.json());
      } else {
        const apiError = await readApiError(response, "Please try again in a moment.");
        if (response.status === 403 && apiError.code === "KYC_REQUIRED") {
          navigate("/kyc");
          return;
        }
        toast({
          title: "Couldn't load statement",
          description: apiError.message,
          variant: "destructive",
        });
        setExpandedId(null);
      }
    } catch {
      toast({
        title: "Couldn't load statement",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
      setExpandedId(null);
    } finally {
      setStatementLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts"
        description="Your open accounts and their current balances."
        actions={
          <button type="button" onClick={() => setShowCreateDialog(true)} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" />
            Open account
          </button>
        }
      />

      {accounts.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={Landmark}
            title="No accounts yet"
            description="Open a checking or savings account to start moving money."
            action={
              <button type="button" onClick={() => setShowCreateDialog(true)} className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" />
                Open your first account
              </button>
            }
          />
        </div>
      ) : (
        <div className="stagger grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account, i) => {
            const Icon = iconFor(account.accountType);
            const expanded = expandedId === account.accountId;

            return (
              <div
                key={account.accountId}
                className="surface-interactive flex flex-col overflow-hidden"
                style={{ "--i": i } as React.CSSProperties}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-muted text-primary">
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.85} aria-hidden="true" />
                    </span>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      Active
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-medium text-foreground">{account.accountType}</p>
                  <p className="tabular text-xs text-muted-foreground">{maskAccount(account.accountId)}</p>

                  <p className="tabular mt-3 text-2xl font-semibold tracking-[-0.025em]">
                    {currency(account.balance)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatement(account.accountId)}
                  aria-expanded={expanded}
                  className="flex items-center justify-between border-t border-border px-5 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                >
                  {expanded ? "Hide activity" : "Recent activity"}
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
                    aria-hidden="true"
                  />
                </button>

                {expanded && (
                  <div className="animate-fade-in border-t border-border bg-background/40 px-3 py-2">
                    {statementLoading ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading
                      </div>
                    ) : statement.length > 0 ? (
                      <div className="divide-y divide-border">
                        {statement.slice(0, 5).map((txn) => (
                          <TransactionRow key={txn.transactionId} transaction={txn} showAccount={false} />
                        ))}
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-muted-foreground">
                        No activity on this account yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Open a new account</DialogTitle>
            <DialogDescription>Choose the type of account you'd like to add.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="mt-2 space-y-5">
            {/* Cards rather than a select: there are two options with real
                differences worth showing, and a dropdown hides both. */}
            <div className="space-y-2.5">
              {ACCOUNT_TYPES.map((type) => {
                const selected = newAccountType === type.value;

                return (
                  <label
                    key={type.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                      selected
                        ? "border-primary bg-primary-muted/50"
                        : "border-border hover:border-border-strong hover:bg-accent/40",
                    )}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={type.value}
                      checked={selected}
                      onChange={(e) => setNewAccountType(e.target.value)}
                      className="sr-only"
                    />

                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors",
                        selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      <type.icon className="h-4 w-4" strokeWidth={1.85} aria-hidden="true" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">{type.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        {type.description}
                      </span>
                    </span>

                    <span
                      className={cn(
                        "mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full border transition-colors",
                        selected ? "border-primary bg-primary" : "border-border-strong",
                      )}
                      aria-hidden="true"
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                    </span>
                  </label>
                );
              })}
            </div>

            {createError && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                {createError}
              </p>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateDialog(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn btn-primary flex-1">
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? "Opening…" : "Open account"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AccountManagement;
