import { useState } from "react";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { useBudgets, useBudgetSummary, useUpsertBudget, useDeleteBudget } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Budget } from "@/lib/services";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

const thisMonth = () => new Date().toISOString().slice(0, 7) + "-01";

export function BudgetsPanel() {
  const { data: budgets, isLoading } = useBudgets();
  const { data: summary } = useBudgetSummary(thisMonth());
  const upsert = useUpsertBudget();
  const del = useDeleteBudget();
  const [form, setForm] = useState<{ category: string; amount: string } | null>(null);

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets" description="Set and track monthly spending limits."
        actions={
          <button type="button" onClick={() => setForm({ category: "", amount: "" })}
            className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Add budget</button>
        }
      />

      {summary && (
        <div className="surface grid grid-cols-3 divide-x divide-border">
          {[
            { label: "Budgeted", value: currency(summary.totalBudgeted) },
            { label: "Spent", value: currency(summary.totalSpent) },
            { label: "Remaining", value: currency(summary.totalBudgeted - summary.totalSpent) },
          ].map(({ label, value }) => (
            <div key={label} className="p-5 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="tabular mt-1 text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {form && (
        <div className="surface p-5 space-y-3">
          <input className="input w-full" placeholder="Category (e.g. Groceries)"
            value={form.category} onChange={e => setForm(f => f && ({ ...f, category: e.target.value }))} />
          <input className="input w-full" placeholder="Monthly limit" type="number"
            value={form.amount} onChange={e => setForm(f => f && ({ ...f, amount: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={upsert.isPending}
              onClick={() => upsert.mutate(
                { category: form.category, amount: parseFloat(form.amount), month: thisMonth() },
                { onSuccess: () => setForm(null) })}>Save</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!budgets?.length ? (
        <div className="surface">
          <EmptyState icon={PiggyBank} title="No budgets" description="Create a budget to track your spending by category." />
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b: Budget) => {
            const pct = Math.min((b.spent / b.amount) * 100, 100);
            const over = b.spent > b.amount;
            return (
              <div key={b.id} className="surface p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{b.category}</p>
                  <div className="flex items-center gap-3">
                    <span className={cn("tabular text-sm", over ? "text-destructive" : "text-muted-foreground")}>
                      {currency(b.spent)} / {currency(b.amount)}
                    </span>
                    <button type="button" onClick={() => del.mutate(b.id)}
                      className="btn btn-sm text-destructive" disabled={del.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", over ? "bg-destructive" : "bg-primary")}
                    style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
