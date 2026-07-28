import { useState } from "react";
import { Target, Plus, Trash2, PiggyBank } from "lucide-react";
import { useSavingsGoals, useCreateSavingsGoal, useContributeToGoal, useDeleteSavingsGoal, useAccounts } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SavingsGoal } from "@/lib/services";
import { currency } from "@/lib/format";

export function SavingsGoalsPanel() {
  const { data: goals, isLoading } = useSavingsGoals();
  const { data: accounts } = useAccounts();
  const create = useCreateSavingsGoal();
  const contribute = useContributeToGoal();
  const del = useDeleteSavingsGoal();
  const [form, setForm] = useState<{ name: string; targetAmount: string } | null>(null);
  const [contributing, setContributing] = useState<{ id: string; amount: string; accountId: string } | null>(null);

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Savings goals" description="Track progress toward your financial goals."
        actions={
          <button type="button" onClick={() => setForm({ name: "", targetAmount: "" })}
            className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> New goal</button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          <input className="input w-full" placeholder="Goal name"
            value={form.name} onChange={e => setForm(f => f && ({ ...f, name: e.target.value }))} />
          <input className="input w-full" placeholder="Target amount" type="number"
            value={form.targetAmount} onChange={e => setForm(f => f && ({ ...f, targetAmount: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={create.isPending}
              onClick={() => create.mutate({ name: form.name, targetAmount: parseFloat(form.targetAmount) },
                { onSuccess: () => setForm(null) })}>Create</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {contributing && (
        <div className="surface p-5 space-y-3">
          <p className="text-sm font-medium">Add contribution</p>
          <select className="input w-full" value={contributing.accountId}
            onChange={e => setContributing(c => c && ({ ...c, accountId: e.target.value }))}>
            <option value="">— choose account —</option>
            {accounts?.map(a => (
              <option key={a.accountId} value={a.accountId}>{a.accountType} — {a.accountId}</option>
            ))}
          </select>
          <input className="input w-full" placeholder="Amount" type="number"
            value={contributing.amount} onChange={e => setContributing(c => c && ({ ...c, amount: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm"
              disabled={contribute.isPending || !contributing.accountId}
              onClick={() => contribute.mutate(
                { id: contributing.id, body: { amount: parseFloat(contributing.amount), accountId: contributing.accountId } },
                { onSuccess: () => setContributing(null) })}>Add</button>
            <button type="button" className="btn btn-sm" onClick={() => setContributing(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!goals?.length ? (
        <div className="surface">
          <EmptyState icon={Target} title="No savings goals" description="Create a goal to start saving toward something meaningful." />
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((g: SavingsGoal) => {
            const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
            return (
              <div key={g.id} className="surface p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{g.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="tabular text-sm text-muted-foreground">
                      {currency(g.currentAmount)} / {currency(g.targetAmount)}
                    </span>
                    <button type="button" onClick={() => setContributing({ id: g.id, amount: "" })}
                      className="btn btn-sm"><PiggyBank className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => del.mutate(g.id)}
                      className="btn btn-sm text-destructive" disabled={del.isPending}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% complete</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
