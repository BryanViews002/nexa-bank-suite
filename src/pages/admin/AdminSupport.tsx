import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Eye,
  Headphones,
  Loader2,
  MessageSquareReply,
  RefreshCw,
  Save,
  StickyNote,
  UserRound,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  AdminEmpty,
  AdminFailure,
  AdminPageHeader,
  AdminPagination,
  AdminStatusBadge,
  AdminTableSkeleton,
  FieldError,
} from "@/components/admin/AdminUi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminApiError, adminRequest } from "@/lib/admin-api";
import {
  AdminSupportTicket,
  AdminUser,
  SpringPage,
  TicketPriority,
  TicketStatus,
} from "@/lib/admin-types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const PRIORITIES: TicketPriority[] = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUSES: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "RESOLVED",
  "CLOSED",
];
const TERMINAL_STATUSES: TicketStatus[] = ["RESOLVED", "CLOSED"];
const formatDate = (value: string) => new Date(value).toLocaleString();

export default function AdminSupport() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<SpringPage<AdminSupportTicket> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [adminsError, setAdminsError] = useState("");
  const [adminsLoading, setAdminsLoading] = useState(true);

  const [detail, setDetail] = useState<AdminSupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionError, setActionError] = useState("");

  const [ticketStatus, setTicketStatus] = useState<TicketStatus>("OPEN");
  const [priority, setPriority] = useState<TicketPriority>("NORMAL");
  const [assignedAdminId, setAssignedAdminId] = useState("UNASSIGNED");
  const [resolution, setResolution] = useState("");
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const [messageMode, setMessageMode] = useState<"reply" | "note">("reply");
  const [messageBody, setMessageBody] = useState("");
  const [messageErrors, setMessageErrors] = useState<Record<string, string>>({});
  const [mutation, setMutation] = useState<null | "update" | "message">(null);

  const loadTickets = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      setResult(
        await adminRequest<SpringPage<AdminSupportTicket>>(
          `/api/v1/admin/support/tickets?page=${page}&size=${PAGE_SIZE}`,
        ),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load support tickets.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  const loadAdmins = useCallback(async () => {
    setAdminsLoading(true);
    setAdminsError("");
    try {
      const users = await adminRequest<AdminUser[]>("/api/v1/admin/users");
      setAdmins(users.filter((user) => user.role === "ROLE_ADMIN"));
    } catch (requestError) {
      setAdminsError(requestError instanceof Error ? requestError.message : "Failed to load administrators.");
    } finally {
      setAdminsLoading(false);
    }
  }, []);

  const applyDetail = useCallback((ticket: AdminSupportTicket) => {
    setDetail(ticket);
    setTicketStatus(ticket.status);
    setPriority(ticket.priority);
    setAssignedAdminId(ticket.assignedAdminId == null ? "UNASSIGNED" : String(ticket.assignedAdminId));
    setResolution(ticket.resolution || "");
  }, []);

  const loadTicket = useCallback(async (id: number, showLoading = true) => {
    if (showLoading) setDetailLoading(true);
    setDetailError("");
    try {
      const ticket = await adminRequest<AdminSupportTicket>(`/api/v1/admin/support/tickets/${id}`);
      applyDetail(ticket);
      return ticket;
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Failed to load ticket details.");
      return null;
    } finally {
      if (showLoading) setDetailLoading(false);
    }
  }, [applyDetail]);

  useEffect(() => {
    loadTickets(true);
  }, [loadTickets]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  const requestedTicket = Number(searchParams.get("ticket"));
  useEffect(() => {
    if (!Number.isInteger(requestedTicket) || requestedTicket <= 0) return;
    setDetailOpen(true);
    setDetail(null);
    setActionError("");
    setMessageBody("");
    setMessageErrors({});
    setUpdateErrors({});
    loadTicket(requestedTicket);
  }, [loadTicket, requestedTicket]);

  const openTicket = (ticket: AdminSupportTicket) => {
    setSearchParams({ ticket: String(ticket.id) });
  };

  const closeTicket = () => {
    if (mutation) return;
    setDetailOpen(false);
    setSearchParams({});
  };

  const refreshCurrent = async () => {
    await Promise.all([
      loadTickets(false),
      detail ? loadTicket(detail.id, false) : Promise.resolve(null),
    ]);
  };

  const updateTicket = async () => {
    if (!detail || mutation) return;
    const errors: Record<string, string> = {};
    if (TERMINAL_STATUSES.includes(ticketStatus) && !resolution.trim()) {
      errors.resolution = "A resolution summary is required for resolved or closed tickets.";
    }
    if (Object.keys(errors).length) {
      setUpdateErrors(errors);
      return;
    }

    setMutation("update");
    setActionError("");
    setUpdateErrors({});
    try {
      await adminRequest(`/api/v1/admin/support/tickets/${detail.id}`, {
        method: "PATCH",
        body: {
          status: ticketStatus,
          priority,
          assignedAdminId: assignedAdminId === "UNASSIGNED" ? null : Number(assignedAdminId),
          resolution: resolution.trim() || null,
        },
      });
      toast.success("Support ticket updated.");
      await refreshCurrent();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) setUpdateErrors(requestError.fieldErrors);
      setActionError(requestError instanceof Error ? requestError.message : "Failed to update the ticket.");
    } finally {
      setMutation(null);
    }
  };

  const sendMessage = async () => {
    if (!detail || mutation || !messageBody.trim()) return;
    const internalNote = messageMode === "note";
    if (!internalNote && TERMINAL_STATUSES.includes(detail.status)) return;

    setMutation("message");
    setActionError("");
    setMessageErrors({});
    try {
      await adminRequest(`/api/v1/admin/support/tickets/${detail.id}/messages`, {
        method: "POST",
        body: { body: messageBody.trim(), internalNote },
      });
      toast.success(internalNote ? "Internal note added." : "Reply sent to customer.");
      setMessageBody("");
      await refreshCurrent();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) setMessageErrors(requestError.fieldErrors);
      setActionError(requestError instanceof Error ? requestError.message : "Failed to add the message.");
    } finally {
      setMutation(null);
    }
  };

  const messages = useMemo(
    () => [...(detail?.messages || [])].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
    [detail?.messages],
  );
  const customerReplyDisabled = Boolean(detail && TERMINAL_STATUSES.includes(detail.status));

  return (
    <div>
      <AdminPageHeader
        title="Support"
        description="Review conversations, coordinate ownership, and respond to customers."
        actions={
          <button
            type="button"
            onClick={() => loadTickets(false)}
            disabled={loading || refreshing}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      {error && !result ? (
        <AdminFailure message={error} onRetry={() => loadTickets(true)} />
      ) : loading ? (
        <AdminTableSkeleton columns={8} rows={8} />
      ) : !result?.content.length ? (
        <section className="surface">
          <AdminEmpty title="No support tickets" description="No tickets were returned for this page." />
        </section>
      ) : (
        <section className="surface overflow-hidden">
          {error && (
            <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.content.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <p className="max-w-64 truncate font-medium">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground">
                        Ticket {ticket.id} - {ticket.messageCount} messages
                      </p>
                    </TableCell>
                    <TableCell>
                      <p>{ticket.userName}</p>
                      <p className="text-xs text-muted-foreground">User ID {ticket.userId}</p>
                    </TableCell>
                    <TableCell>{ticket.category.replaceAll("_", " ")}</TableCell>
                    <TableCell><AdminStatusBadge value={ticket.priority} /></TableCell>
                    <TableCell><AdminStatusBadge value={ticket.status} /></TableCell>
                    <TableCell>{ticket.assignedAdminName || "Unassigned"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <p>{formatDate(ticket.updatedAt)}</p>
                      <p className="text-xs">Opened {formatDate(ticket.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openTicket(ticket)}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
                        aria-label={`Open ticket ${ticket.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="px-5 pb-5">
            <AdminPagination page={result.number} totalPages={result.totalPages} onChange={setPage} />
          </div>
        </section>
      )}

      <Dialog open={detailOpen} onOpenChange={(open) => !open && closeTicket()}>
        <DialogContent className="flex max-h-[94vh] w-[calc(100%-1.5rem)] max-w-6xl flex-col overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4 pr-12">
            <DialogTitle>{detail?.subject || "Support ticket"}</DialogTitle>
            <DialogDescription>
              {detail ? `Ticket ${detail.id} - ${detail.userName} - User ID ${detail.userId}` : "Loading conversation"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="grid min-h-[520px] place-items-center" aria-busy="true">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detailError ? (
            <div className="p-6">
              <AdminFailure
                message={detailError}
                onRetry={() => requestedTicket && loadTicket(requestedTicket)}
              />
            </div>
          ) : detail ? (
            <div className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
              <section className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
                <div className="min-h-[280px] flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4 sm:p-5">
                  {!messages.length ? (
                    <AdminEmpty title="No messages" description="This ticket has no conversation messages." />
                  ) : (
                    messages.map((message) => (
                      <article
                        key={message.id}
                        className={cn(
                          "max-w-[92%] rounded-lg border p-3.5",
                          message.internalNote
                            ? "border-warning/30 bg-warning/10"
                            : message.fromSupport
                              ? "ml-auto border-primary/30 bg-primary-muted/50"
                              : "border-border bg-card",
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {message.internalNote ? (
                              <StickyNote className="h-4 w-4 text-warning" />
                            ) : message.fromSupport ? (
                              <Headphones className="h-4 w-4 text-primary" />
                            ) : (
                              <UserRound className="h-4 w-4 text-muted-foreground" />
                            )}
                            <p className="text-xs font-semibold">{message.authorName}</p>
                            {message.internalNote && (
                              <span className="text-[10px] font-semibold uppercase text-warning">Internal note</span>
                            )}
                          </div>
                          <time className="text-[11px] text-muted-foreground">{formatDate(message.createdAt)}</time>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                      </article>
                    ))
                  )}
                </div>

                <div className="border-t border-border bg-background p-4 sm:p-5">
                  <div className="mb-3 inline-flex rounded-lg border border-border bg-muted/30 p-1">
                    <button
                      type="button"
                      onClick={() => setMessageMode("reply")}
                      disabled={customerReplyDisabled || Boolean(mutation)}
                      className={cn(
                        "flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium",
                        messageMode === "reply" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      <MessageSquareReply className="h-3.5 w-3.5" />
                      Customer reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setMessageMode("note")}
                      disabled={Boolean(mutation)}
                      className={cn(
                        "flex h-8 items-center gap-2 rounded-md px-3 text-xs font-medium",
                        messageMode === "note" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      <StickyNote className="h-3.5 w-3.5" />
                      Internal note
                    </button>
                  </div>

                  {customerReplyDisabled && messageMode === "reply" && (
                    <p className="mb-3 text-xs text-warning">
                      Move this ticket to an active status before replying to the customer.
                    </p>
                  )}

                  <label htmlFor="support-message" className="sr-only">
                    {messageMode === "note" ? "Internal note" : "Customer reply"}
                  </label>
                  <textarea
                    id="support-message"
                    value={messageBody}
                    onChange={(event) => {
                      setMessageBody(event.target.value);
                      setMessageErrors((current) => ({ ...current, body: "" }));
                    }}
                    rows={4}
                    disabled={Boolean(mutation) || (messageMode === "reply" && customerReplyDisabled)}
                    aria-invalid={Boolean(messageErrors.body)}
                    placeholder={messageMode === "note" ? "Add an internal note" : "Write a response to the customer"}
                    className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm"
                  />
                  <FieldError message={messageErrors.body} />
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={
                        Boolean(mutation) ||
                        !messageBody.trim() ||
                        (messageMode === "reply" && customerReplyDisabled)
                      }
                      className="btn btn-primary"
                    >
                      {mutation === "message" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : messageMode === "note" ? (
                        <StickyNote className="h-4 w-4" />
                      ) : (
                        <MessageSquareReply className="h-4 w-4" />
                      )}
                      {mutation === "message"
                        ? "Submitting..."
                        : messageMode === "note"
                          ? "Add note"
                          : "Send reply"}
                    </button>
                  </div>
                </div>
              </section>

              <aside className="overflow-y-auto p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Ticket controls</h3>
                </div>

                {actionError && (
                  <p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                    {actionError}
                  </p>
                )}

                <div className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="ticket-status" className="field-label">Status</label>
                    <select
                      id="ticket-status"
                      value={ticketStatus}
                      onChange={(event) => {
                        setTicketStatus(event.target.value as TicketStatus);
                        setUpdateErrors((current) => ({ ...current, status: "", resolution: "" }));
                      }}
                      disabled={Boolean(mutation)}
                      aria-invalid={Boolean(updateErrors.status)}
                      className="field"
                    >
                      {STATUSES.map((value) => (
                        <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                      ))}
                    </select>
                    <FieldError message={updateErrors.status} />
                  </div>

                  <div>
                    <label htmlFor="ticket-priority" className="field-label">Priority</label>
                    <select
                      id="ticket-priority"
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as TicketPriority)}
                      disabled={Boolean(mutation)}
                      aria-invalid={Boolean(updateErrors.priority)}
                      className="field"
                    >
                      {PRIORITIES.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                    <FieldError message={updateErrors.priority} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="ticket-assignee" className="field-label">Assigned administrator</label>
                      {adminsError && (
                        <button type="button" onClick={loadAdmins} className="text-xs font-medium text-primary">
                          Retry
                        </button>
                      )}
                    </div>
                    <select
                      id="ticket-assignee"
                      value={assignedAdminId}
                      onChange={(event) => setAssignedAdminId(event.target.value)}
                      disabled={Boolean(mutation) || adminsLoading}
                      aria-invalid={Boolean(updateErrors.assignedAdminId)}
                      className="field"
                    >
                      <option value="UNASSIGNED">
                        {adminsLoading ? "Loading administrators..." : "Unassigned"}
                      </option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                          {admin.fullName || admin.username} (ID {admin.id})
                        </option>
                      ))}
                    </select>
                    {adminsError && <p className="mt-1 text-xs text-destructive">{adminsError}</p>}
                    <FieldError message={updateErrors.assignedAdminId} />
                  </div>

                  <div>
                    <label htmlFor="ticket-resolution" className="field-label">
                      Resolution summary
                      {TERMINAL_STATUSES.includes(ticketStatus) && <span className="text-destructive"> *</span>}
                    </label>
                    <textarea
                      id="ticket-resolution"
                      value={resolution}
                      onChange={(event) => {
                        setResolution(event.target.value);
                        setUpdateErrors((current) => ({ ...current, resolution: "" }));
                      }}
                      rows={4}
                      disabled={Boolean(mutation)}
                      aria-invalid={Boolean(updateErrors.resolution)}
                      className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm"
                    />
                    <FieldError message={updateErrors.resolution} />
                  </div>

                  <button
                    type="button"
                    onClick={updateTicket}
                    disabled={Boolean(mutation)}
                    className="btn btn-primary w-full"
                  >
                    {mutation === "update" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {mutation === "update" ? "Saving..." : "Save ticket"}
                  </button>
                </div>

                <div className="mt-6 space-y-3 border-t border-border pt-5 text-xs text-muted-foreground">
                  <p>Category: {detail.category.replaceAll("_", " ")}</p>
                  <p>Created: {formatDate(detail.createdAt)}</p>
                  <p>Updated: {formatDate(detail.updatedAt)}</p>
                </div>
              </aside>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
