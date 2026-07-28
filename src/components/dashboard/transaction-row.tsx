import { ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { currency, formatRelative, maskAccount, titleCase } from "@/lib/format";

export interface TransactionLike {
  transactionId: number;
  accountId?: number;
  amount: number;
  type: string;
  date: string;
}

/** Icon and tone are driven by the movement's direction, not its label. */
function directionOf(type: string) {
  const t = (type ?? "").toLowerCase();
  if (t === "deposit") return { icon: ArrowDownLeft, credit: true };
  if (t === "transfer") return { icon: Repeat, credit: false };
  return { icon: ArrowUpRight, credit: false };
}

interface TransactionRowProps {
  transaction: TransactionLike;
  showAccount?: boolean;
  className?: string;
}

export function TransactionRow({ transaction, showAccount = true, className }: TransactionRowProps) {
  const { icon: Icon, credit } = directionOf(transaction.type);

  return (
    <div className={cn("flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent/60", className)}>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full",
          credit ? "bg-credit-muted text-credit" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{titleCase(transaction.type)}</p>
        <p className="truncate text-xs text-muted-foreground">
          {formatRelative(transaction.date)}
          {showAccount && transaction.accountId !== undefined && (
            <>
              <span className="mx-1.5 opacity-50">·</span>
              {maskAccount(transaction.accountId)}
            </>
          )}
        </p>
      </div>

      <span className={cn("tabular shrink-0 text-sm font-medium", credit ? "text-credit" : "text-foreground")}>
        {credit ? "+" : "−"}
        {currency(Math.abs(transaction.amount))}
      </span>
    </div>
  );
}

export default TransactionRow;
