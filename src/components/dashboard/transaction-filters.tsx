import { useEffect, useRef, useState } from "react";
import { ArrowDownUp, Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface FilterState {
  search: string;
  type: string;
  dateRange: string;
  amountMin: string;
  amountMax: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  type: "all",
  dateRange: "all",
  amountMin: "",
  amountMax: "",
  sortBy: "date",
  sortOrder: "desc",
};

interface TransactionFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  transactionCount: number;
  filteredCount: number;
}

const TYPES = [
  { value: "all", label: "All types" },
  { value: "Deposit", label: "Deposits" },
  { value: "Withdraw", label: "Withdrawals" },
  { value: "Transfer", label: "Transfers" },
];

const RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
  { value: "quarter", label: "Last 3 months" },
  { value: "year", label: "Last 12 months" },
];

const SORTS = [
  { value: "date", label: "Date" },
  { value: "amount", label: "Amount" },
  { value: "type", label: "Type" },
  { value: "account", label: "Account" },
];

export function TransactionFilters({ onFiltersChange, transactionCount, filteredCount }: TransactionFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");

  // Debounce the text field so filtering a long ledger doesn't re-sort on
  // every keystroke. The other controls apply immediately — they're discrete.
  const onChangeRef = useRef(onFiltersChange);
  onChangeRef.current = onFiltersChange;

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.search === searchInput) return prev;
        const next = { ...prev, search: searchInput };
        onChangeRef.current(next);
        return next;
      });
    }, 180);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const update = (patch: Partial<FilterState>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    onFiltersChange(next);
  };

  const reset = () => {
    setSearchInput("");
    setFilters(DEFAULT_FILTERS);
    onFiltersChange(DEFAULT_FILTERS);
  };

  // Sort order isn't a "filter", so it doesn't count toward the badge.
  const advancedActive = [
    filters.type !== "all",
    filters.dateRange !== "all",
    Boolean(filters.amountMin),
    Boolean(filters.amountMax),
  ].filter(Boolean).length;

  const anyActive = advancedActive > 0 || Boolean(filters.search);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by reference or account"
            aria-label="Search transactions"
            className="field pl-10 pr-10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="btn btn-secondary shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {advancedActive > 0 && (
                  <span className="tabular ml-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    {advancedActive}
                  </span>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[300px] p-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="filter-type" className="field-label text-[13px]">
                    Type
                  </label>
                  <select
                    id="filter-type"
                    value={filters.type}
                    onChange={(e) => update({ type: e.target.value })}
                    className="field h-10"
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-range" className="field-label text-[13px]">
                    Date range
                  </label>
                  <select
                    id="filter-range"
                    value={filters.dateRange}
                    onChange={(e) => update({ dateRange: e.target.value })}
                    className="field h-10"
                  >
                    {RANGES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <span className="field-label text-[13px]">Amount</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={filters.amountMin}
                      onChange={(e) => update({ amountMin: e.target.value })}
                      placeholder="Min"
                      aria-label="Minimum amount"
                      className="field tabular h-10"
                    />
                    <span className="text-sm text-muted-foreground">to</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      value={filters.amountMax}
                      onChange={(e) => update({ amountMax: e.target.value })}
                      placeholder="Max"
                      aria-label="Maximum amount"
                      className="field tabular h-10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="filter-sort" className="field-label text-[13px]">
                    Sort by
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="filter-sort"
                      value={filters.sortBy}
                      onChange={(e) => update({ sortBy: e.target.value })}
                      className="field h-10 flex-1"
                    >
                      {SORTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => update({ sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
                      title={filters.sortOrder === "asc" ? "Ascending" : "Descending"}
                      className="btn btn-secondary h-10 w-10 shrink-0 px-0"
                    >
                      <ArrowDownUp
                        className={cn(
                          "h-4 w-4 transition-transform",
                          filters.sortOrder === "asc" && "rotate-180",
                        )}
                      />
                      <span className="sr-only">Toggle sort direction</span>
                    </button>
                  </div>
                </div>

                {advancedActive > 0 && (
                  <button type="button" onClick={reset} className="btn btn-ghost btn-sm w-full">
                    Clear filters
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {anyActive && (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <span className="tabular">
            Showing {filteredCount} of {transactionCount}
          </span>
          <button
            type="button"
            onClick={reset}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}

export default TransactionFilters;
