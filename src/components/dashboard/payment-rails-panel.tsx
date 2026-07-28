import { useState } from "react";
import { Globe, Plus } from "lucide-react";
import { useExternalTransfers, useFundAccount, usePayout } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ExternalTransfer } from "@/lib/services";
import { currency } from "@/lib/format";

type Mode = null | "fund" | "payout";

const emptyForm = { accountId: "", amount: "", currency: "USD", externalAccount: "", routingNumber: "" };

export function PaymentRailsPanel() {
  const { data: transfers, isLoading } = useExternalTransfers();
  const fund = useFundAccount();
  const payout = usePayout();
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState(emptyForm);

  const submit = () => {
    const body = { ...form, amount: parseFloat(form.amount) };
    const mutation = mode === "fund" ? fund : payout;
    mutation.mutate(body, { onSuccess: () => { setMode(null); setForm(emptyForm); } });
  };

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="External transfers" description="Fund your account or send payouts externally."
        actions={
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode("fund")} className="btn btn-primary btn-sm">Fund</button>
            <button type="button" onClick={() => setMode("payout")} className="btn btn-sm">Payout</button>
          </div>
        }
      />

      {mode && (
        <div className="surface p-5 space-y-3">
          <p className="text-sm font-medium">{mode === "fund" ? "Fund account" : "Send payout"}</p>
          {(["accountId", "amount", "externalAccount", "routingNumber"] as const).map(f => (
            <input key={f} className="input w-full" placeholder={f}
              value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
          ))}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm"
              disabled={fund.isPending || payout.isPending} onClick={submit}>Submit</button>
            <button type="button" className="btn btn-sm" onClick={() => setMode(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!transfers?.length ? (
        <div className="surface">
          <EmptyState icon={Globe} title="No external transfers" description="Fund your account or initiate a payout to get started." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {transfers.map((t: ExternalTransfer) => (
            <div key={t.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="text-sm font-medium">{t.type}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="tabular text-sm font-semibold">{currency(t.amount)}</p>
                <p className="text-xs text-muted-foreground">{t.status}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
