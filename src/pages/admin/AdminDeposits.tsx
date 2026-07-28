import { FormEvent, useMemo, useState } from "react";
import { CircleDollarSign, Info, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { AdminPageHeader, FieldError } from "@/components/admin/AdminUi";
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
import { AdminApiError, adminRequest } from "@/lib/admin-api";
import { AdminDepositRequest } from "@/lib/admin-types";

interface DepositForm {
  accountId: string;
  amount: string;
  description: string;
}

const EMPTY_FORM: DepositForm = { accountId: "", amount: "", description: "" };
const newIdempotencyKey = () =>
  typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function AdminDeposits() {
  const [form, setForm] = useState<DepositForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [attemptFingerprint, setAttemptFingerprint] = useState("");

  const parsedRequest = useMemo<AdminDepositRequest>(
    () => ({
      accountId: Number(form.accountId),
      amount: Number(form.amount),
      description: form.description.trim(),
      category: "ADMIN_ADJUSTMENT",
    }),
    [form],
  );

  const fingerprint = JSON.stringify(parsedRequest);
  const formatAmount = () => {
    const amount = Number(form.amount);
    return Number.isFinite(amount) ? amount.toFixed(2) : form.amount;
  };

  const updateField = (name: keyof DepositForm, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    setRequestError("");
    if (attemptFingerprint) {
      setIdempotencyKey("");
      setAttemptFingerprint("");
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!/^\d+$/.test(form.accountId) || Number(form.accountId) <= 0) {
      errors.accountId = "Enter a positive numeric account ID.";
    }
    if (!form.amount || !Number.isFinite(Number(form.amount)) || Number(form.amount) < 0.01) {
      errors.amount = "Amount must be at least 0.01.";
    }
    if (!form.description.trim()) {
      errors.description = "Enter a clear administrative adjustment description.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const requestConfirmation = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    if (!idempotencyKey || attemptFingerprint !== fingerprint) {
      setIdempotencyKey(newIdempotencyKey());
      setAttemptFingerprint(fingerprint);
    }
    setRequestError("");
    setConfirmationOpen(true);
  };

  const submitDeposit = async () => {
    if (submitting || !validate()) return;
    const key = idempotencyKey || newIdempotencyKey();
    if (!idempotencyKey) {
      setIdempotencyKey(key);
      setAttemptFingerprint(fingerprint);
    }

    setSubmitting(true);
    setRequestError("");
    setFieldErrors({});
    try {
      await adminRequest("/api/v1/transactions/deposit", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: parsedRequest,
      });
      toast.success("Administrative deposit completed.");
      setConfirmationOpen(false);
      setForm(EMPTY_FORM);
      setIdempotencyKey("");
      setAttemptFingerprint("");
    } catch (error) {
      if (error instanceof AdminApiError) setFieldErrors(error.fieldErrors);
      setRequestError(error instanceof Error ? error.message : "The deposit could not be completed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Administrative deposits"
        description="Credit a known destination account using an idempotent administrative adjustment."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,680px)_minmax(260px,1fr)]">
        <section className="surface p-5 sm:p-6">
          <form onSubmit={requestConfirmation} className="space-y-5" noValidate>
            {requestError && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
                <p className="text-sm font-medium">Deposit failed</p>
                <p className="mt-1 text-sm text-muted-foreground">{requestError}</p>
                {idempotencyKey && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Retry preserves the same idempotency key for this attempt.
                  </p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="deposit-account-id" className="field-label">Destination account ID</label>
              <input
                id="deposit-account-id"
                inputMode="numeric"
                value={form.accountId}
                onChange={(event) => updateField("accountId", event.target.value)}
                aria-invalid={Boolean(fieldErrors.accountId)}
                placeholder="Known numeric account ID"
                className="field"
              />
              <FieldError message={fieldErrors.accountId} />
              <p className="field-hint">This is an account ID, not a user ID.</p>
            </div>

            <div>
              <label htmlFor="deposit-amount" className="field-label">Amount</label>
              <div className="relative">
                <input
                  id="deposit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => updateField("amount", event.target.value)}
                  aria-invalid={Boolean(fieldErrors.amount)}
                  placeholder="0.00"
                  className="field"
                />
              </div>
              <FieldError message={fieldErrors.amount} />
            </div>

            <div>
              <label htmlFor="deposit-description" className="field-label">Description</label>
              <textarea
                id="deposit-description"
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={4}
                aria-invalid={Boolean(fieldErrors.description)}
                placeholder="Approved account adjustment"
                className="w-full rounded-lg border border-input bg-background px-3.5 py-3 text-sm"
              />
              <FieldError message={fieldErrors.description} />
            </div>

            <div>
              <label className="field-label">Category</label>
              <div className="field flex items-center bg-muted/30 text-muted-foreground">
                ADMIN ADJUSTMENT
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary w-full sm:w-auto">
              <CircleDollarSign className="h-4 w-4" />
              Review deposit
            </button>
          </form>
        </section>

        <aside className="border-l-2 border-warning/40 px-4 py-1">
          <Info className="h-5 w-5 text-warning" aria-hidden="true" />
          <h2 className="mt-3 text-sm font-semibold">Advanced tool</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The backend cannot currently look up another customer's accounts from the admin user record.
            Use this page only when the destination account ID is already known.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The destination customer's KYC status must be approved. The backend validates that requirement
            when the deposit is submitted.
          </p>
        </aside>
      </div>

      <AlertDialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!submitting) setConfirmationOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm administrative deposit</AlertDialogTitle>
            <AlertDialogDescription>
              Verify the destination and amount before moving money.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 border-y border-border py-4 text-sm">
            <dt className="text-muted-foreground">Account ID</dt>
            <dd className="tabular text-right font-medium">{form.accountId}</dd>
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="tabular text-right font-semibold">{formatAmount()}</dd>
            <dt className="text-muted-foreground">Description</dt>
            <dd className="break-words text-right">{form.description.trim()}</dd>
            <dt className="text-muted-foreground">Category</dt>
            <dd className="text-right">ADMIN ADJUSTMENT</dd>
          </dl>
          {requestError && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
              {requestError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                submitDeposit();
              }}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : requestError ? (
                <RefreshCw className="h-4 w-4" />
              ) : (
                <CircleDollarSign className="h-4 w-4" />
              )}
              {submitting ? "Submitting..." : requestError ? "Retry deposit" : "Confirm deposit"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
