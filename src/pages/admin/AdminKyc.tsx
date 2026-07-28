import { useEffect, useMemo, useState } from "react";
import { Check, Download, Eye, FileText, Image, Loader2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { AdminEmpty, AdminFailure, AdminPageHeader, AdminStatusBadge, AdminTableSkeleton, FieldError } from "@/components/admin/AdminUi";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminApiError, adminBlob, adminRequest } from "@/lib/admin-api";
import { AdminKycDocument, AdminUser } from "@/lib/admin-types";

const formatDate = (value: string) => new Date(value).toLocaleString();
const documentType = (contentType: string) =>
  contentType === "application/pdf" ? "PDF" : contentType.startsWith("image/") ? contentType.split("/")[1].toUpperCase() : contentType;

export default function AdminKyc() {
  const [documents, setDocuments] = useState<AdminKycDocument[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminKycDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const [previewRetryKey, setPreviewRetryKey] = useState(0);
  const [actionError, setActionError] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const userMap = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);
  const decisionRunning = approving || rejecting;

  const loadQueue = async () => {
    setLoading(true);
    setError("");
    try {
      const [pending, allUsers] = await Promise.all([
        adminRequest<AdminKycDocument[]>("/api/v1/admin/kyc"),
        adminRequest<AdminUser[]>("/api/v1/admin/users"),
      ]);
      setDocuments(pending);
      setUsers(allUsers);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load pending KYC reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (!selected) {
      setPreviewUrl("");
      return;
    }

    let active = true;
    let objectUrl = "";
    setPreviewLoading(true);
    setPreviewError("");

    adminBlob(`/api/v1/admin/kyc/${selected.id}/document`)
      .then(({ blob }) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      })
      .catch((requestError) => {
        if (active) setPreviewError(requestError instanceof Error ? requestError.message : "Document preview failed.");
      })
      .finally(() => active && setPreviewLoading(false));

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selected, previewRetryKey]);

  const removeReviewed = (document: AdminKycDocument, status: "APPROVED" | "REJECTED") => {
    setDocuments((current) => current.filter((item) => item.id !== document.id));
    setUsers((current) => current.map((user) => user.id === document.userId ? { ...user, kycStatus: status } : user));
    setSelected(null);
  };

  const approve = async () => {
    if (!selected || decisionRunning) return;
    setApproving(true);
    setActionError("");
    try {
      await adminRequest(`/api/v1/admin/kyc/${selected.id}/approve`, { method: "POST" });
      removeReviewed(selected, "APPROVED");
      setApproveOpen(false);
      toast.success("KYC document approved.");
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : "Approval failed.");
      setApproveOpen(false);
    } finally {
      setApproving(false);
    }
  };

  const reject = async () => {
    if (!selected || decisionRunning) return;
    if (!reason.trim()) {
      setReasonError("A rejection reason is required.");
      return;
    }
    setRejecting(true);
    setReasonError("");
    setActionError("");
    try {
      await adminRequest(`/api/v1/admin/kyc/${selected.id}/reject`, {
        method: "POST",
        body: { reason: reason.trim() },
      });
      removeReviewed(selected, "REJECTED");
      setRejectOpen(false);
      setReason("");
      toast.success("KYC document rejected.");
    } catch (requestError) {
      if (requestError instanceof AdminApiError) setReasonError(requestError.fieldErrors.reason);
      setActionError(requestError instanceof Error ? requestError.message : "Rejection failed.");
    } finally {
      setRejecting(false);
    }
  };

  const currentUser = selected ? userMap.get(selected.userId) : undefined;

  return (
    <div>
      <AdminPageHeader
        title="KYC review"
        description="Review pending identity documents and make an approval decision."
        actions={
          <button type="button" onClick={loadQueue} disabled={loading} className="btn btn-secondary btn-sm">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh queue
          </button>
        }
      />

      {error ? (
        <AdminFailure message={error} onRetry={loadQueue} />
      ) : loading ? (
        <AdminTableSkeleton columns={5} />
      ) : !documents.length ? (
        <section className="surface"><AdminEmpty title="No pending KYC reviews" description="The review queue is clear." /></section>
      ) : (
        <section className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[840px]">
              <TableHeader><TableRow>
                <TableHead>Customer</TableHead><TableHead>Document</TableHead><TableHead>Uploaded</TableHead>
                <TableHead>Status</TableHead><TableHead className="w-28">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {documents.map((document) => {
                  const user = userMap.get(document.userId);
                  return (
                    <TableRow key={document.id}>
                      <TableCell>
                        <p className="font-medium">{user?.fullName || `User ${document.userId}`}</p>
                        <p className="text-xs text-muted-foreground">{user ? `@${user.username} - ${user.email}` : `User ID ${document.userId}`}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {document.contentType === "application/pdf" ? <FileText className="h-4 w-4 text-primary" /> : <Image className="h-4 w-4 text-primary" />}
                          <div><p className="max-w-56 truncate text-sm">{document.filename}</p><p className="text-xs text-muted-foreground">{documentType(document.contentType)}</p></div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(document.uploadedAt)}</TableCell>
                      <TableCell><AdminStatusBadge value={document.status} /></TableCell>
                      <TableCell>
                        <button type="button" onClick={() => { setSelected(document); setActionError(""); }}
                          className="btn btn-secondary btn-sm"><Eye className="h-4 w-4" /> Review</button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && !decisionRunning && setSelected(null)}>
        <DialogContent className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-5xl flex-col p-0">
          {selected && (
            <>
              <DialogHeader className="border-b border-border px-5 py-4 pr-12">
                <DialogTitle>{currentUser?.fullName || `User ${selected.userId}`}</DialogTitle>
                <DialogDescription>
                  {currentUser ? `@${currentUser.username} - ${currentUser.email} - ` : ""}User ID {selected.userId}
                </DialogDescription>
              </DialogHeader>

              <div className="min-h-0 flex-1 overflow-auto bg-muted/20 p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div><p className="text-sm font-medium">{selected.filename}</p><p className="text-xs text-muted-foreground">{documentType(selected.contentType)} - {formatDate(selected.uploadedAt)}</p></div>
                  {previewUrl ? (
                    <a href={previewUrl} download={selected.filename} className="btn btn-secondary btn-sm">
                      <Download className="h-4 w-4" /> Download
                    </a>
                  ) : (
                    <button type="button" disabled className="btn btn-secondary btn-sm">
                      <Download className="h-4 w-4" /> Download
                    </button>
                  )}
                </div>
                <div className="grid min-h-[420px] place-items-center overflow-hidden rounded-lg border border-border bg-background">
                  {previewLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Loading document</div>
                  ) : previewError ? (
                    <div className="max-w-sm p-6 text-center">
                      <p className="text-sm font-medium">Document unavailable</p>
                      <p className="mt-1 text-sm text-muted-foreground">{previewError}</p>
                      <button
                        type="button"
                        onClick={() => setPreviewRetryKey((value) => value + 1)}
                        className="btn btn-secondary btn-sm mt-4"
                      >
                        <RefreshCw className="h-4 w-4" /> Retry
                      </button>
                    </div>
                  ) : selected.contentType === "application/pdf" && previewUrl ? (
                    <iframe src={previewUrl} title={selected.filename} className="h-[60vh] w-full" />
                  ) : ["image/jpeg", "image/png"].includes(selected.contentType) && previewUrl ? (
                    <img src={previewUrl} alt={selected.filename} className="max-h-[60vh] max-w-full object-contain" />
                  ) : (
                    <div className="p-6 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm">Preview is not available for this file type.</p></div>
                  )}
                </div>
                {actionError && <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">{actionError}</p>}
              </div>

              <div className="flex flex-col gap-3 border-t border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">Document ID {selected.id}</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setActionError(""); setRejectOpen(true); }} disabled={decisionRunning} className="btn btn-secondary">
                    <X className="h-4 w-4" /> Reject
                  </button>
                  <button type="button" onClick={() => setApproveOpen(true)} disabled={decisionRunning} className="btn btn-primary">
                    <Check className="h-4 w-4" /> Approve
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Approve this KYC document?</AlertDialogTitle>
            <AlertDialogDescription>Approval immediately enables protected banking operations for this customer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); approve(); }} disabled={approving}>
              {approving ? "Approving..." : "Approve document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectOpen} onOpenChange={(open) => { if (!rejecting) setRejectOpen(open); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject KYC document</DialogTitle>
            <DialogDescription>The customer will see this reason and can submit a replacement document.</DialogDescription>
          </DialogHeader>
          <div>
            {actionError && (
              <p role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                {actionError}
              </p>
            )}
            <label htmlFor="rejection-reason" className="field-label">Reason</label>
            <textarea id="rejection-reason" value={reason} onChange={(event) => { setReason(event.target.value); setReasonError(""); setActionError(""); }}
              rows={5} className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm" />
            <FieldError message={reasonError} />
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setRejectOpen(false)} disabled={rejecting} className="btn btn-secondary">Cancel</button>
            <button type="button" onClick={reject} disabled={rejecting || !reason.trim()} className="btn btn-primary">
              {rejecting && <Loader2 className="h-4 w-4 animate-spin" />}
              {rejecting ? "Rejecting..." : "Reject document"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
