/** Presentation-layer formatters. Keep every user-facing number going through
 *  one of these so rounding and separators stay consistent across the app. */

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

/** "$1,234.56" */
export const currency = (value: number) => usd.format(Number.isFinite(value) ? value : 0);

/** "$1,235" — for axis ticks and other places cents are noise. */
export const currencyWhole = (value: number) => usdWhole.format(Number.isFinite(value) ? value : 0);

/** "$1.2K" — for chart axes and tight stat tiles. */
export const currencyCompact = (value: number) => usdCompact.format(Number.isFinite(value) ? value : 0);

/**
 * Splits an amount into its integer and fraction parts so a large balance can
 * render the cents smaller and de-emphasised. Returns display-ready strings.
 */
export function splitCurrency(value: number): { unit: string; cents: string; sign: string } {
  const safe = Number.isFinite(value) ? value : 0;
  const sign = safe < 0 ? "-" : "";
  const parts = usd.formatToParts(Math.abs(safe));
  const fraction = parts.find((p) => p.type === "fraction")?.value ?? "00";
  const unit = parts
    .filter((p) => p.type !== "fraction" && p.type !== "decimal")
    .map((p) => p.value)
    .join("");
  return { unit, cents: fraction, sign };
}

/** Signed amount with an explicit + for credits: "+$240.00" / "-$18.50" */
export const signedCurrency = (value: number) => `${value > 0 ? "+" : value < 0 ? "-" : ""}${currency(Math.abs(value))}`;

/** "1,204" */
export const number = (value: number) => new Intl.NumberFormat("en-US").format(value ?? 0);

/** "2.4%" — expects a ratio, not a percentage. */
export const percent = (ratio: number, decimals = 1) =>
  `${(ratio * 100).toFixed(decimals).replace(/\.0$/, "")}%`;

const dateShort = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const dateMedium = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const timeShort = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

const toDate = (input: string | number | Date) => {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** "Mar 4" */
export const formatDateShort = (input: string | number | Date) => {
  const d = toDate(input);
  return d ? dateShort.format(d) : "—";
};

/** "Mar 4, 2026" */
export const formatDate = (input: string | number | Date) => {
  const d = toDate(input);
  return d ? dateMedium.format(d) : "—";
};

/** "Mar 4, 2026 · 2:15 PM" */
export const formatDateTime = (input: string | number | Date) => {
  const d = toDate(input);
  return d ? `${dateMedium.format(d)} · ${timeShort.format(d)}` : "—";
};

/**
 * "Today" / "Yesterday" / "3 days ago" / "Mar 4" — collapses to an absolute
 * date past a week, where relative phrasing stops being useful.
 */
export function formatRelative(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "—";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfThat = new Date(d);
  startOfThat.setHours(0, 0, 0, 0);

  const days = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return `${days} days ago`;
  return dateShort.format(d);
}

/** Groups a transaction date into a section heading for a grouped list. */
export function dateGroupLabel(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "Earlier";

  const label = formatRelative(input);
  if (label === "Today" || label === "Yesterday") return label;

  const now = new Date();
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) return "Earlier this month";
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
}

/**
 * Renders an internal account id the way a bank statement would, rather than
 * exposing the raw database key: "Checking ···· 1042".
 */
export function accountLabel(accountType: string | undefined, accountId: number): string {
  const type = (accountType ?? "Account").trim();
  return `${type} ${maskAccount(accountId)}`;
}

/** "···· 1042" */
export const maskAccount = (accountId: number) => `···· ${String(accountId).padStart(4, "0").slice(-4)}`;

/** Two-letter avatar initials from a display name or username. */
export function initials(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** First name only, for greetings. Empty when we don't know it. */
export const firstName = (fullName: string | undefined | null) =>
  (fullName ?? "").trim().split(/\s+/)[0] || "";

/**
 * Every non-deposit movement leaves the account, so it renders as an outflow.
 * Centralised because the sign convention is used by the list, the table, the
 * totals and the chart reconstruction, and they must not disagree.
 */
export const isCredit = (type: string | undefined) => (type ?? "").toLowerCase() === "deposit";

/** Signed amount for a transaction, positive for credits. */
export const signedAmount = (type: string | undefined, amount: number) =>
  isCredit(type) ? Math.abs(amount) : -Math.abs(amount);

/** Sentence-cases a backend enum-ish string: "WITHDRAW" -> "Withdraw". */
export const titleCase = (value: string | undefined) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};
