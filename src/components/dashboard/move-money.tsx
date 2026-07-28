import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Check, Loader2, Search, Send, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, jsonPost, withCredentials } from "@/lib/api";
import { cn } from "@/lib/utils";
import { accountLabel, currency, initials } from "@/lib/format";

interface Account {
  accountId: number;
  balance: number;
  accountType: string;
}

interface User {
  userId: number;
  username: string;
  fullName: string;
}

interface MoveMoneyProps {
  accounts: Account[];
  onComplete: () => void;
}

type Mode = "send" | "deposit" | "withdraw";

const MODES: { id: Mode; label: string; icon: typeof Send }[] = [
  { id: "send", label: "Send", icon: Send },
  { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
  { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
];

const COPY: Record<Mode, { title: string; description: string; submit: string; accountLabel: string }> = {
  send: {
    title: "Send money",
    description: "Transfer to another Nexa user by username.",
    submit: "Send",
    accountLabel: "From account",
  },
  deposit: {
    title: "Deposit",
    description: "Add funds to one of your accounts.",
    submit: "Deposit",
    accountLabel: "To account",
  },
  withdraw: {
    title: "Withdraw",
    description: "Take funds out of one of your accounts.",
    submit: "Withdraw",
    accountLabel: "From account",
  },
};

export function MoveMoney({ accounts, onComplete }: MoveMoneyProps) {
  const [mode, setMode] = useState<Mode>("send");
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Recipient search
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [recipient, setRecipient] = useState<User | null>(null);

  const comboRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const selectedAccount = accounts.find((a) => String(a.accountId) === accountId);
  const parsedAmount = Number.parseFloat(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;

  // Advisory only. The server is the authority on whether a movement is
  // allowed, so this warns without blocking submission on a possibly stale
  // balance.
  const exceedsBalance =
    mode !== "deposit" && selectedAccount !== undefined && validAmount && parsedAmount > selectedAccount.balance;

  // Default to the first account so the form isn't empty on arrival.
  useEffect(() => {
    if (!accountId && accounts.length > 0) setAccountId(String(accounts[0].accountId));
  }, [accounts, accountId]);

  // Debounced username lookup.
  useEffect(() => {
    if (mode !== "send") return;

    const trimmed = query.trim();
    if (!trimmed || recipient?.username === trimmed) {
      setResults([]);
      setShowResults(false);
      return;
    }

    let cancelled = false;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(apiUrl(`/users/search?query=${encodeURIComponent(trimmed)}`), withCredentials);
        if (cancelled) return;

        if (response.ok) {
          const users: User[] = await response.json();
          setResults(users);
          setShowResults(true);
          setHighlighted(0);
        } else {
          setResults([]);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      setSearching(false);
    };
  }, [query, mode, recipient]);

  // Dismiss the results list on an outside click.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(event.target as Node)) setShowResults(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const resetForm = () => {
    setAmount("");
    setQuery("");
    setRecipient(null);
    setResults([]);
    setShowResults(false);
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    resetForm();
  };

  const pickRecipient = (user: User) => {
    setRecipient(user);
    setQuery(user.username);
    setShowResults(false);
    setResults([]);
  };

  const onRecipientKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showResults || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickRecipient(results[highlighted]);
    } else if (e.key === "Escape") {
      setShowResults(false);
    }
  };

  const canSubmit =
    Boolean(accountId) && selectedAccount !== undefined && validAmount && (mode !== "send" || query.trim().length > 0) && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      let response: Response;

      if (mode === "send") {
        const fromId = selectedAccount?.accountId ?? parseInt(accountId);
        response = await fetch(
          apiUrl("/transactions/transfer"),
          jsonPost({
            fromAccountId: fromId,
            // Backend may use toIdentifier or toUsername — send both
            toIdentifier: query.trim(),
            toUsername: query.trim(),
            amount: parseFloat(amount),
          }),
        );
      } else {
        const resolvedAccountId = selectedAccount?.accountId;
        response = await fetch(
          apiUrl(mode === "deposit" ? "/transactions/deposit" : "/transactions/withdraw"),
          jsonPost({
            accountId: resolvedAccountId,
            amount: parseFloat(amount),
          }),
        );
      }

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        toast({
          title:
            mode === "send"
              ? `Sent ${currency(parsedAmount)}`
              : mode === "deposit"
                ? `Deposited ${currency(parsedAmount)}`
                : `Withdrew ${currency(parsedAmount)}`,
          description: data.message || "Your balance has been updated.",
        });
        resetForm();
        onComplete();
      } else {
        if (response.status === 403 && data.code === "KYC_REQUIRED") {
          navigate("/kyc");
          return;
        }
        setError(
          typeof data.message === "string" && data.message
            ? data.message
            : `We couldn't complete that ${mode}. Please try again.`,
        );
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = COPY[mode];

  const submitLabel = useMemo(() => {
    if (submitting) return "Processing…";
    return validAmount ? `${copy.submit} ${currency(parsedAmount)}` : copy.submit;
  }, [submitting, validAmount, parsedAmount, copy.submit]);

  return (
    <div className="surface overflow-hidden">
      {/* Segmented control — three related actions on one form beats three
          separate cards each with their own account picker. */}
      <div className="flex gap-1 border-b border-border p-1.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => switchMode(m.id)}
            aria-pressed={mode === m.id}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              mode === m.id
                ? "bg-accent text-foreground shadow-xs"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <m.icon className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
            {m.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div>
          <h2 className="text-base font-semibold">{copy.title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{copy.description}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <span className="flex-1">{error}</span>
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

        {/* Amount leads — it's the value the user came to enter. */}
        <div>
          <label htmlFor="amount" className="field-label">
            Amount
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-medium text-muted-foreground"
              aria-hidden="true"
            >
              $
            </span>
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="0.00"
              required
              className="tabular h-16 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-2xl font-semibold transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground/50 focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.16)] focus:outline-none"
            />
          </div>

          {exceedsBalance && (
            <p className="field-hint flex items-center gap-1.5 text-warning">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              This is more than the {currency(selectedAccount!.balance)} available in that account.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="account" className="field-label">
            {copy.accountLabel}
          </label>
          <select
            id="account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
            className="field"
          >
            {accounts.length === 0 && <option value="">No accounts available</option>}
            {accounts.map((account) => (
              <option key={account.accountId} value={account.accountId}>
                {accountLabel(account.accountType, account.accountId)} — {currency(account.balance)}
              </option>
            ))}
          </select>
        </div>

        {mode === "send" && (
          <div ref={comboRef} className="relative">
            <label htmlFor="recipient" className="field-label">
              Send to
            </label>

            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="recipient"
                type="text"
                role="combobox"
                aria-expanded={showResults}
                aria-autocomplete="list"
                aria-controls="recipient-results"
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setRecipient(null);
                  setError("");
                }}
                onKeyDown={onRecipientKeyDown}
                onFocus={() => results.length > 0 && setShowResults(true)}
                placeholder="Search by username"
                required
                className={cn("field pl-10", recipient ? "pr-10" : "pr-10")}
              />

              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : recipient ? (
                  <Check className="h-4 w-4 text-credit" strokeWidth={2.5} aria-hidden="true" />
                ) : null}
              </span>
            </div>

            {recipient ? (
              <p className="field-hint">
                Sending to <span className="font-medium text-foreground">{recipient.fullName}</span>
              </p>
            ) : (
              <p className="field-hint">Type a username, then pick from the list.</p>
            )}

            {showResults && results.length > 0 && (
              <ul
                id="recipient-results"
                role="listbox"
                className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-64 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg"
              >
                {results.map((user, i) => (
                  <li key={user.userId} role="option" aria-selected={i === highlighted}>
                    <button
                      type="button"
                      onMouseEnter={() => setHighlighted(i)}
                      onClick={() => pickRecipient(user)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors",
                        i === highlighted ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-muted text-[11px] font-semibold text-primary">
                        {initials(user.fullName || user.username)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-foreground">{user.fullName}</span>
                        <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {showResults && !searching && query.trim() && results.length === 0 && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-lg border border-border bg-popover px-3 py-3 text-sm text-muted-foreground shadow-lg">
                No user matches “{query.trim()}”.
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={!canSubmit} className="btn btn-primary w-full">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </form>
    </div>
  );
}

export default MoveMoney;
