import { useState } from "react";
import { CreditCard, Snowflake, Sun, Trash2, Plus } from "lucide-react";
import { useCards, useIssueCard, useFreezeCard, useUnfreezeCard, useCancelCard, useAccounts } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/lib/services";
import { cn } from "@/lib/utils";

export function CardsPanel() {
  const { data: cards, isLoading } = useCards();
  const { data: accounts } = useAccounts();
  const issueCard = useIssueCard();
  const freeze = useFreezeCard();
  const unfreeze = useUnfreezeCard();
  const cancel = useCancelCard();
  const [form, setForm] = useState<{ accountId: string; cardType: string } | null>(null);

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cards"
        description="Manage your virtual and physical cards."
        actions={
          <button type="button" onClick={() => setForm({ accountId: accounts?.[0]?.accountId ?? "", cardType: "VIRTUAL" })}
            className="btn btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Issue card
          </button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Account</label>
            <select className="input w-full" value={form.accountId}
              onChange={e => setForm(f => f && ({ ...f, accountId: e.target.value }))}>
              {accounts?.map(a => (
                <option key={a.accountId} value={a.accountId}>{a.accountType} — {a.accountId}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Card type</label>
            <select className="input w-full" value={form.cardType}
              onChange={e => setForm(f => f && ({ ...f, cardType: e.target.value }))}>
              <option value="VIRTUAL">Virtual</option>
              <option value="PHYSICAL">Physical</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={issueCard.isPending}
              onClick={() => issueCard.mutate(form, { onSuccess: () => setForm(null) })}>Issue</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {!cards?.length ? (
        <div className="surface">
          <EmptyState icon={CreditCard} title="No cards yet" description="Issue a virtual or physical card to get started." />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card: Card) => (
            <div key={card.id} className="surface p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.cardType}</p>
                  <p className="font-mono text-sm mt-0.5">{card.cardNumber}</p>
                </div>
                <span className={cn(
                  "text-[11px] font-medium px-2 py-0.5 rounded-full",
                  card.status === "ACTIVE" ? "bg-credit/15 text-credit" : "bg-muted text-muted-foreground"
                )}>
                  {card.status}
                </span>
              </div>
              <div className="flex gap-2">
                {card.status === "ACTIVE" ? (
                  <button type="button" onClick={() => freeze.mutate(card.id)}
                    className="btn btn-sm flex-1 gap-1.5" disabled={freeze.isPending}>
                    <Snowflake className="h-3.5 w-3.5" /> Freeze
                  </button>
                ) : (
                  <button type="button" onClick={() => unfreeze.mutate(card.id)}
                    className="btn btn-sm flex-1 gap-1.5" disabled={unfreeze.isPending}>
                    <Sun className="h-3.5 w-3.5" /> Unfreeze
                  </button>
                )}
                <button type="button" onClick={() => cancel.mutate(card.id)}
                  className="btn btn-sm text-destructive hover:bg-destructive/10" disabled={cancel.isPending}>
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
