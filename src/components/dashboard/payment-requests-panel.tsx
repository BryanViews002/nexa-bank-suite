import { useState } from "react";
import { BarChart3, Plus, Check, X } from "lucide-react";
import {
  usePaymentRequests, useCreatePaymentRequest,
  useAcceptPaymentRequest, useDeclinePaymentRequest, useCancelPaymentRequest,
  useAccounts,
} from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PaymentRequest } from "@/lib/services";
import { currency } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PaymentRequestsPanel() {
  const { data: requests, isLoading } = usePaymentRequests();
  const { data: accounts } = useAccounts();
  const create = useCreatePaymentRequest();
  const accept = useAcceptPaymentRequest();
  const decline = useDeclinePaymentRequest();
  const cancel = useCancelPaymentRequest();
  const [form, setForm] = useState<{ toUserId: string; amount: string; note: string } | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [payerAccountId, setPayerAccountId] = useState("");

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Payment requests" description="Send and manage payment requests."
        actions={
          <button type="button" onClick={() => setForm({ toUserId: "", amount: "", note: "" })}
            className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> Request</button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          <input className="input w-full" placeholder="To user ID"
            value={form.toUserId} onChange={e => setForm(f => f && ({ ...f, toUserId: e.target.value }))} />
          <input className="input w-full" placeholder="Amount" type="number"
            value={form.amount} onChange={e => setForm(f => f && ({ ...f, amount: e.target.value }))} />
          <input className="input w-full" placeholder="Note (optional)"
            value={form.note} onChange={e => setForm(f => f && ({ ...f, note: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={create.isPending}
              onClick={() => create.mutate({ toUserId: form.toUserId, amount: parseFloat(form.amount), note: form.note },
                { onSuccess: () => setForm(null) })}>Send</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {acceptingId && (
        <div className="surface p-5 space-y-3">
          <p className="text-sm font-medium">Select account to pay from</p>
          <select className="input w-full" value={payerAccountId}
            onChange={e => setPayerAccountId(e.target.value)}>
            <option value="">-- choose account --</option>
            {accounts?.map(a => (
              <option key={a.accountId} value={a.accountId}>{a.accountType} - {a.accountId}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm"
              disabled={!payerAccountId || accept.isPending}
              onClick={() => accept.mutate({ id: acceptingId, body: { payerAccountId } },
                { onSuccess: () => { setAcceptingId(null); setPayerAccountId(""); } })}>Pay</button>
            <button type="button" className="btn btn-sm" onClick={() => setAcceptingId(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!requests?.length ? (
        <div className="surface">
          <EmptyState icon={BarChart3} title="No payment requests" description="Request money from another user to get started." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {requests.map((r: PaymentRequest) => (
            <div key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.note || "Payment request"}</p>
                <p className="text-xs text-muted-foreground">From {r.fromUserId} to {r.toUserId}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="tabular text-sm font-semibold">{currency(r.amount)}</span>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium",
                  r.status === "PENDING" ? "bg-yellow-500/15 text-yellow-600" : "bg-muted text-muted-foreground")}>
                  {r.status}
                </span>
                {r.status === "PENDING" && (
                  <div className="flex gap-1">
                    <button type="button" title="Accept"
                      onClick={() => { setAcceptingId(r.id); setPayerAccountId(accounts?.[0]?.accountId ?? ""); }}
                      className="btn btn-sm text-credit"><Check className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Decline"
                      onClick={() => decline.mutate(r.id)}
                      className="btn btn-sm text-destructive"><X className="h-3.5 w-3.5" /></button>
                    <button type="button" title="Cancel own"
                      onClick={() => cancel.mutate(r.id)}
                      className="btn btn-sm text-muted-foreground">Cancel</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
