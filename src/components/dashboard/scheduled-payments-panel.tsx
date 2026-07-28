import { useState } from "react";
import { CalendarClock, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  useScheduledPayments, useCreateScheduledPayment,
  useToggleScheduledPayment, useDeleteScheduledPayment,
} from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ScheduledPayment } from "@/lib/services";
import { currency } from "@/lib/format";

const emptyForm = { accountId: "", toAccountId: "", amount: "", frequency: "MONTHLY", startDate: "" };

export function ScheduledPaymentsPanel() {
  const { data: payments, isLoading } = useScheduledPayments();
  const create = useCreateScheduledPayment();
  const toggle = useToggleScheduledPayment();
  const del = useDeleteScheduledPayment();
  const [form, setForm] = useState<typeof emptyForm | null>(null);

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Scheduled payments" description="Automate recurring transfers."
        actions={
          <button type="button" onClick={() => setForm(emptyForm)} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Schedule
          </button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          {(["accountId", "toAccountId", "amount", "startDate"] as const).map(f => (
            <input key={f} className="input w-full" placeholder={f}
              type={f === "amount" ? "number" : f === "startDate" ? "date" : "text"}
              value={form[f]} onChange={e => setForm(p => p && ({ ...p, [f]: e.target.value }))} />
          ))}
          <select className="input w-full" value={form.frequency}
            onChange={e => setForm(p => p && ({ ...p, frequency: e.target.value }))}>
            {["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={create.isPending}
              onClick={() => create.mutate(
                { ...form, amount: parseFloat(form.amount) },
                { onSuccess: () => setForm(null) })}>Save</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!payments?.length ? (
        <div className="surface">
          <EmptyState icon={CalendarClock} title="No scheduled payments" description="Set up a recurring payment to automate transfers." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {payments.map((p: ScheduledPayment) => (
            <div key={p.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium tabular">{currency(p.amount)}</p>
                <p className="text-xs text-muted-foreground">{p.frequency} · next {new Date(p.nextRunDate).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => toggle.mutate({ id: p.id, enable: !p.enabled })}
                  className="btn btn-sm" disabled={toggle.isPending}>
                  {p.enabled
                    ? <ToggleRight className="h-4 w-4 text-credit" />
                    : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button type="button" onClick={() => del.mutate(p.id)}
                  className="btn btn-sm text-destructive" disabled={del.isPending}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
