import { useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { useDisputes, useCreateDispute, useWithdrawDispute } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Dispute } from "@/lib/services";
import { cn } from "@/lib/utils";

export function DisputesPanel() {
  const { data: disputes, isLoading } = useDisputes();
  const create = useCreateDispute();
  const withdraw = useWithdrawDispute();
  const [form, setForm] = useState<{ transactionId: string; reason: string } | null>(null);

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disputes"
        description="File and track transaction disputes."
        actions={
          <button type="button" onClick={() => setForm({ transactionId: "", reason: "" })}
            className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> File dispute
          </button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          <input className="input w-full" placeholder="Transaction ID"
            value={form.transactionId} onChange={e => setForm(f => f && ({ ...f, transactionId: e.target.value }))} />
          <input className="input w-full" placeholder="Reason"
            value={form.reason} onChange={e => setForm(f => f && ({ ...f, reason: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm"
              disabled={create.isPending}
              onClick={() => { create.mutate(form, { onSuccess: () => setForm(null) }); }}>
              Submit
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!disputes?.length ? (
        <div className="surface">
          <EmptyState icon={AlertCircle} title="No disputes" description="File a dispute if you see an unrecognised transaction." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {disputes.map((d: Dispute) => (
            <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{d.reason}</p>
                <p className="text-xs text-muted-foreground">Txn #{d.transactionId}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full",
                  d.status === "OPEN" ? "bg-yellow-500/15 text-yellow-600" : "bg-muted text-muted-foreground")}>
                  {d.status}
                </span>
                {d.status === "OPEN" && (
                  <button type="button" className="btn btn-sm text-destructive"
                    disabled={withdraw.isPending} onClick={() => withdraw.mutate(d.id)}>
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
