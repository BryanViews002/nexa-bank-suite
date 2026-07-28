import { useState } from "react";
import { HeadphonesIcon, Plus, Send } from "lucide-react";
import { useSupportTickets, useCreateTicket, useReplyToTicket, useCloseTicket, useSupportTicket } from "@/hooks/useApi";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SupportTicket } from "@/lib/services";
import { cn } from "@/lib/utils";

export function SupportPanel() {
  const { data: paged, isLoading } = useSupportTickets();
  const createTicket = useCreateTicket();
  const reply = useReplyToTicket();
  const close = useCloseTicket();
  const [form, setForm] = useState<{ subject: string; body: string } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: detail } = useSupportTicket(selected ?? "");

  if (isLoading) return <div className="surface p-6 animate-pulse h-40" />;

  const tickets = paged?.content ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Support" description="Open and manage support tickets."
        actions={
          <button type="button" onClick={() => setForm({ subject: "", body: "" })}
            className="btn btn-primary btn-sm"><Plus className="h-4 w-4" /> New ticket</button>
        }
      />

      {form && (
        <div className="surface p-5 space-y-3">
          <input className="input w-full" placeholder="Subject"
            value={form.subject} onChange={e => setForm(f => f && ({ ...f, subject: e.target.value }))} />
          <textarea className="input w-full min-h-[80px]" placeholder="Describe your issue"
            value={form.body} onChange={e => setForm(f => f && ({ ...f, body: e.target.value }))} />
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={createTicket.isPending}
              onClick={() => createTicket.mutate(form, { onSuccess: () => setForm(null) })}>Submit</button>
            <button type="button" className="btn btn-sm" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      {selected && detail && (
        <div className="surface p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{detail.subject}</p>
            <div className="flex gap-2">
              {detail.status !== "CLOSED" && (
                <button type="button" className="btn btn-sm" onClick={() => close.mutate(detail.id)}>Close ticket</button>
              )}
              <button type="button" className="btn btn-sm" onClick={() => setSelected(null)}>Back</button>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {detail.messages?.map(m => (
              <div key={m.id} className="rounded-lg bg-muted px-3 py-2 text-sm">
                <p className="text-xs text-muted-foreground mb-1">{m.authorId}</p>
                {m.body}
              </div>
            ))}
          </div>
          {detail.status !== "CLOSED" && (
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Reply…" value={replyText}
                onChange={e => setReplyText(e.target.value)} />
              <button type="button" className="btn btn-primary btn-sm"
                disabled={reply.isPending || !replyText}
                onClick={() => reply.mutate({ id: detail.id, body: { body: replyText } },
                  { onSuccess: () => setReplyText("") })}>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {!tickets.length ? (
        <div className="surface">
          <EmptyState icon={HeadphonesIcon} title="No tickets" description="Open a support ticket if you need help." />
        </div>
      ) : (
        <div className="surface divide-y divide-border">
          {tickets.map((t: SupportTicket) => (
            <button key={t.id} type="button" onClick={() => setSelected(t.id)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-accent/40 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground">{new Date(t.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0",
                t.status === "OPEN" ? "bg-yellow-500/15 text-yellow-600" : "bg-muted text-muted-foreground")}>
                {t.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
