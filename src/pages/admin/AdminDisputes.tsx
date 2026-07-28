import { useCallback, useEffect, useState } from "react";
import {
  CircleDollarSign,
  Eye,
  Loader2,
  RefreshCw,
  Save,
  Scale,
} from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminApiError, adminRequest } from "@/lib/admin-api";
import { AdminDispute, DisputeStatus, SpringPage } from "@/lib/admin-types";

const PAGE_SIZE = 20;
const FILTER_STATUSES: Array<"ALL" | DisputeStatus> = [
  "ALL",
  "OPEN",
  "UNDER_REVIEW",
  "EVIDENCE_REQUESTED",
  "RESOLVED_CUSTOMER",
  "RESOLVED_MERCHANT",
  "WITHDRAWN",
];
const INVESTIGATION_STATUSES: DisputeStatus[] = ["OPEN", "UNDER_REVIEW", "EVIDENCE_REQUESTED"];

const formatDate = (value?: string | null) => value ? new Date(value).toLocaleString() : "Not recorded";
const formatMoney = (amount: number, currency: string) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export default function AdminDisputes() {
  const [status, setStatus] = useState<"ALL" | DisputeStatus>("OPEN");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<SpringPage<AdminDispute> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState<AdminDispute | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [actionError, setActionError] = useState("");

  const [investigationStatus, setInvestigationStatus] = useState<DisputeStatus>("UNDER_REVIEW");
  const [investigationNote, setInvestigationNote] = useState("");
  const [investigationErrors, setInvestigationErrors] = useState<Record<string, string>>({});
  const [creditOpen, setCreditOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<"" | "CUSTOMER" | "MERCHANT">("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [resolutionErrors, setResolutionErrors] = useState<Record<string, string>>({});
  const [mutation, setMutation] = useState<null | "status" | "credit" | "resolve">(null);

  const loadDisputes = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
      if (status !== "ALL") params.set("status", status);
      setResult(await adminRequest<SpringPage<AdminDispute>>(`/api/v1/admin/disputes?${params}`));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load disputes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, status]);

  const loadDetail = async (id: number, showLoading = true) => {
    if (showLoading) setDetailLoading(true);
    setDetailError("");
    try {
      const current = await adminRequest<AdminDispute>(`/api/v1/admin/disputes/${id}`);
      setDetail(current);
      setInvestigationStatus(
        INVESTIGATION_STATUSES.includes(current.status) ? current.status : "UNDER_REVIEW",
      );
      return current;
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : "Failed to load dispute details.");
      return null;
    } finally {
      if (showLoading) setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes(true);
  }, [loadDisputes]);

  const openDetail = (dispute: AdminDispute) => {
    setDetail(dispute);
    setDetailOpen(true);
    setActionError("");
    setInvestigationNote("");
    setInvestigationErrors({});
    setResolutionOutcome("");
    setResolutionNote("");
    setResolutionErrors({});
    loadDetail(dispute.id);
  };

  const refreshCurrent = async () => {
    await Promise.all([
      loadDisputes(false),
      detail ? loadDetail(detail.id, false) : Promise.resolve(null),
    ]);
  };

  const updateInvestigation = async () => {
    if (!detail || mutation || investigationNote.length > 2000) return;
    setMutation("status");
    setActionError("");
    setInvestigationErrors({});
    try {
      await adminRequest(`/api/v1/admin/disputes/${detail.id}`, {
        method: "PATCH",
        body: {
          status: investigationStatus,
          ...(investigationNote.trim() ? { note: investigationNote.trim() } : {}),
        },
      });
      toast.success("Investigation status updated.");
      setInvestigationNote("");
      await refreshCurrent();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) setInvestigationErrors(requestError.fieldErrors);
      setActionError(requestError instanceof Error ? requestError.message : "Failed to update the dispute.");
    } finally {
      setMutation(null);
    }
  };

  const grantCredit = async () => {
    if (!detail || mutation || detail.status !== "OPEN" || detail.provisionalCreditGranted) return;
    setMutation("credit");
    setActionError("");
    try {
      await adminRequest(`/api/v1/admin/disputes/${detail.id}/provisional-credit`, { method: "POST" });
      toast.success("Provisional credit granted.");
      setCreditOpen(false);
      await refreshCurrent();
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Failed to grant provisional credit.");
      setCreditOpen(false);
    } finally {
      setMutation(null);
    }
  };

  const resolveDispute = async () => {
    if (!detail || mutation) return;
    const errors: Record<string, string> = {};
    if (!resolutionOutcome) errors.inFavourOfCustomer = "Select a resolution outcome.";
    if (!resolutionNote.trim()) errors.resolutionNote = "A resolution note is required.";
    if (Object.keys(errors).length) {
      setResolutionErrors(errors);
      return;
    }

    setMutation("resolve");
    setActionError("");
    setResolutionErrors({});
    try {
      await adminRequest(`/api/v1/admin/disputes/${detail.id}/resolve`, {
        method: "POST",
        body: {
          inFavourOfCustomer: resolutionOutcome === "CUSTOMER",
          resolutionNote: resolutionNote.trim(),
        },
      });
      toast.success("Dispute resolved.");
      setResolveOpen(false);
      setResolutionOutcome("");
      setResolutionNote("");
      await refreshCurrent();
    } catch (requestError) {
      if (requestError instanceof AdminApiError) setResolutionErrors(requestError.fieldErrors);
      setActionError(requestError instanceof Error ? requestError.message : "Failed to resolve the dispute.");
    } finally {
      setMutation(null);
    }
  };

  const readOnly = detail
    ? ["RESOLVED_CUSTOMER", "RESOLVED_MERCHANT", "WITHDRAWN"].includes(detail.status)
    : true;
  const canGrantCredit = Boolean(
    detail && detail.status === "OPEN" && !detail.provisionalCreditGranted && !mutation,
  );

  return (
    <div>
      <AdminPageHeader
        title="Disputes"
        description="Investigate transaction disputes, manage provisional credit, and record outcomes."
        actions={
          <button
            type="button"
            onClick={() => loadDisputes(false)}
            disabled={loading || refreshing}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="mb-5 max-w-xs">
        <label htmlFor="dispute-status-filter" className="field-label">Status</label>
        <select
          id="dispute-status-filter"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as typeof status);
            setPage(0);
          }}
          className="field"
        >
          {FILTER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value === "ALL" ? "All statuses" : value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {error && !result ? (
        <AdminFailure message={error} onRetry={() => loadDisputes(true)} />
      ) : loading ? (
        <AdminTableSkeleton columns={9} rows={8} />
      ) : !result?.content.length ? (
        <section className="surface">
          <AdminEmpty title="No disputes found" description="No cases match the selected status." />
        </section>
      ) : (
        <section className="surface overflow-hidden">
          {error && (
            <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          <div className="overflow-x-auto">
            <Table className="min-w-[1180px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provisional credit</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-20">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.content.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      <p className="font-medium">{dispute.caseReference}</p>
                      <p className="text-xs text-muted-foreground">ID {dispute.id}</p>
                    </TableCell>
                    <TableCell>
                      <p>{dispute.userName}</p>
                      <p className="text-xs text-muted-foreground">User ID {dispute.userId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-44 truncate">{dispute.transactionReference}</p>
                      <p className="text-xs text-muted-foreground">ID {dispute.transactionId}</p>
                    </TableCell>
                    <TableCell>{dispute.reason.replaceAll("_", " ")}</TableCell>
                    <TableCell className="tabular font-medium">
                      {formatMoney(dispute.amount, dispute.currency)}
                    </TableCell>
                    <TableCell><AdminStatusBadge value={dispute.status} /></TableCell>
                    <TableCell>{dispute.provisionalCreditGranted ? "Granted" : "Not granted"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <p>{formatDate(dispute.updatedAt)}</p>
                      <p className="text-xs">Created {formatDate(dispute.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => openDetail(dispute)}
                        className="grid h-8 w-8 place-items-center rounded-md hover:bg-accent"
                        aria-label={`Review ${dispute.caseReference}`}
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

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          if (!mutation) setDetailOpen(open);
        }}
      >
        <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.caseReference || "Dispute detail"}</DialogTitle>
            <DialogDescription>
              Review the case record and apply supported investigation actions.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="grid min-h-72 place-items-center" aria-busy="true">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detailError ? (
            <AdminFailure
              message={detailError}
              onRetry={() => detail && loadDetail(detail.id)}
            />
          ) : detail ? (
            <div className="space-y-6">
              <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="eyebrow">Customer</p>
                  <p className="mt-1 text-sm font-medium">{detail.userName}</p>
                  <p className="text-xs text-muted-foreground">User ID {detail.userId}</p>
                </div>
                <div>
                  <p className="eyebrow">Amount</p>
                  <p className="tabular mt-1 text-sm font-semibold">
                    {formatMoney(detail.amount, detail.currency)}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Status</p>
                  <div className="mt-2"><AdminStatusBadge value={detail.status} /></div>
                </div>
                <div>
                  <p className="eyebrow">Provisional credit</p>
                  <p className="mt-1 text-sm">
                    {detail.provisionalCreditGranted ? "Granted" : "Not granted"}
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <p className="eyebrow">Source transaction</p>
                  <p className="mt-1 break-words text-sm">{detail.transactionReference}</p>
                  <p className="text-xs text-muted-foreground">Transaction ID {detail.transactionId}</p>
                </div>
                <div>
                  <p className="eyebrow">Reason</p>
                  <p className="mt-1 text-sm">{detail.reason.replaceAll("_", " ")}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="eyebrow">Customer description</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6">
                    {detail.description || "No description was provided."}
                  </p>
                </div>
                {detail.resolutionNote && (
                  <div className="md:col-span-2">
                    <p className="eyebrow">Resolution note</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{detail.resolutionNote}</p>
                  </div>
                )}
              </div>

              {actionError && (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
                  {actionError}
                </p>
              )}

              {readOnly ? (
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                  This dispute is closed and is available for review only.
                </div>
              ) : (
                <div className="space-y-6 border-t border-border pt-6">
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Investigation status</h3>
                    </div>
                    <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-start">
                      <div>
                        <label htmlFor="investigation-status" className="field-label">Status</label>
                        <select
                          id="investigation-status"
                          value={investigationStatus}
                          onChange={(event) => setInvestigationStatus(event.target.value as DisputeStatus)}
                          className="field"
                          disabled={Boolean(mutation)}
                        >
                          {INVESTIGATION_STATUSES.map((value) => (
                            <option key={value} value={value}>{value.replaceAll("_", " ")}</option>
                          ))}
                        </select>
                        <FieldError message={investigationErrors.status} />
                      </div>
                      <div>
                        <label htmlFor="investigation-note" className="field-label">
                          Note <span className="text-muted-foreground">(optional)</span>
                        </label>
                        <textarea
                          id="investigation-note"
                          value={investigationNote}
                          onChange={(event) => setInvestigationNote(event.target.value)}
                          rows={3}
                          maxLength={2000}
                          disabled={Boolean(mutation)}
                          aria-invalid={Boolean(investigationErrors.note)}
                          className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm"
                        />
                        <div className="flex justify-between gap-3">
                          <FieldError message={investigationErrors.note} />
                          <span className="ml-auto mt-1 text-xs text-muted-foreground">
                            {investigationNote.length}/2000
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={updateInvestigation}
                        disabled={Boolean(mutation)}
                        className="btn btn-secondary md:mt-[30px]"
                      >
                        {mutation === "status" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Update
                      </button>
                    </div>
                  </section>

                  <section className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Financial decision</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Money-moving actions require explicit confirmation.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setCreditOpen(true)}
                        disabled={!canGrantCredit}
                        className="btn btn-secondary"
                      >
                        <CircleDollarSign className="h-4 w-4" />
                        Grant provisional credit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError("");
                          setResolutionErrors({});
                          setResolveOpen(true);
                        }}
                        disabled={Boolean(mutation)}
                        className="btn btn-primary"
                      >
                        Resolve dispute
                      </button>
                    </div>
                  </section>
                </div>
              )}

              <div className="grid gap-3 border-t border-border pt-4 text-xs text-muted-foreground sm:grid-cols-3">
                <p>Created: {formatDate(detail.createdAt)}</p>
                <p>Updated: {formatDate(detail.updatedAt)}</p>
                <p>Resolved: {formatDate(detail.resolvedAt)}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={creditOpen} onOpenChange={(open) => !mutation && setCreditOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Grant provisional credit?</AlertDialogTitle>
            <AlertDialogDescription>
              This immediately moves money into the customer's account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {detail && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 border-y border-border py-4 text-sm">
              <dt className="text-muted-foreground">Customer</dt><dd className="text-right">{detail.userName}</dd>
              <dt className="text-muted-foreground">Case</dt><dd className="break-all text-right">{detail.caseReference}</dd>
              <dt className="text-muted-foreground">Amount</dt><dd className="tabular text-right font-semibold">{formatMoney(detail.amount, detail.currency)}</dd>
              <dt className="text-muted-foreground">Source</dt><dd className="break-all text-right">{detail.transactionReference}</dd>
            </dl>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation === "credit"}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                grantCredit();
              }}
              disabled={mutation === "credit"}
            >
              {mutation === "credit" && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation === "credit" ? "Granting..." : "Confirm credit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resolveOpen} onOpenChange={(open) => !mutation && setResolveOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve dispute</DialogTitle>
            <DialogDescription>
              Choose the final outcome. A merchant outcome reclaims any provisional credit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionError && (
              <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                {actionError}
              </p>
            )}
            <div>
              <label htmlFor="resolution-outcome" className="field-label">Outcome</label>
              <select
                id="resolution-outcome"
                value={resolutionOutcome}
                onChange={(event) => {
                  setResolutionOutcome(event.target.value as typeof resolutionOutcome);
                  setResolutionErrors((current) => ({ ...current, inFavourOfCustomer: "" }));
                }}
                aria-invalid={Boolean(resolutionErrors.inFavourOfCustomer)}
                className="field"
                disabled={mutation === "resolve"}
              >
                <option value="">Select outcome</option>
                <option value="CUSTOMER">In favour of customer</option>
                <option value="MERCHANT">In favour of merchant</option>
              </select>
              <FieldError message={resolutionErrors.inFavourOfCustomer} />
            </div>
            <div>
              <label htmlFor="resolution-note" className="field-label">Resolution note</label>
              <textarea
                id="resolution-note"
                value={resolutionNote}
                onChange={(event) => {
                  setResolutionNote(event.target.value);
                  setResolutionErrors((current) => ({ ...current, resolutionNote: "" }));
                }}
                rows={5}
                maxLength={2000}
                aria-invalid={Boolean(resolutionErrors.resolutionNote)}
                disabled={mutation === "resolve"}
                className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm"
              />
              <FieldError message={resolutionErrors.resolutionNote} />
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setResolveOpen(false)}
              disabled={mutation === "resolve"}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={resolveDispute}
              disabled={mutation === "resolve"}
              className="btn btn-primary"
            >
              {mutation === "resolve" && <Loader2 className="h-4 w-4 animate-spin" />}
              {mutation === "resolve" ? "Resolving..." : "Confirm resolution"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
