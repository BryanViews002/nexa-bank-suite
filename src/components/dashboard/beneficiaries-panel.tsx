import { useState } from "react";
import { Users, Plus, Trash2 } from "lucide-react";
import { useBeneficiaries, useCreateBeneficiary, useDeleteBeneficiary } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Beneficiary } from "@/lib/services";

const emptyForm = { name: "", accountNumber: "", bankName: "", routingNumber: "" };

export function BeneficiariesPanel() {
  const { data: beneficiaries, isLoading } = useBeneficiaries();
  const create = useCreateBeneficiary();
  const del = useDeleteBeneficiary();
  const [form, setForm] = useState<typeof emptyForm | null>(null);

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Beneficiaries" description="Manage saved payees for quick transfers."
        actions={
          <button type="button" onClick={() => setForm(emptyForm)} className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Add
          </button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          {(["name", "accountNumber", "bankName", "routingNumber"] as const).map(f => (
            <input key={f} className="input w-full" placeholder={f}
              value={form[f]} onChange={e => setForm(p => p && ({ ...p, [f]: e.target.value }))} />
          ))}
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={create.isPending}
              onClick={() => create.mutate(form, { onSuccess: () => setForm(null) })}>Save</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!beneficiaries?.length ? (
        <div className="surface">
          <EmptyState icon={Users} title="No beneficiaries" description="Add a beneficiary to speed up future transfers." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {beneficiaries.map((b: Beneficiary) => (
            <div key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.bankName} · {b.accountNumber}</p>
              </div>
              <button type="button" onClick={() => del.mutate(b.id)}
                className="btn btn-sm text-destructive shrink-0" disabled={del.isPending}>
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
