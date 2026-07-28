import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  FileUp,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AuthError, AuthLayout } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { refreshCsrfToken } from "@/lib/admin-api";
import { apiUrl, readApiError, withCredentials } from "@/lib/api";
import {
  clearPostAuthRedirect,
  KycNextAction,
  KycStatus,
  resolveAuthRedirect,
  setPostAuthRedirect,
} from "@/lib/auth-flow";

interface KycForm {
  fullName: string;
  dateOfBirth: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  documentType: string;
  documentNumber: string;
}

interface KycDocument {
  id?: string | number;
  documentType?: string;
  type?: string;
  fileName?: string;
  name?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: string;
}

interface KycResponse {
  kycStatus?: KycStatus;
  status?: KycStatus;
  kycRequired?: boolean;
  nextAction?: KycNextAction;
  redirectTo?: string;
  documents?: KycDocument[];
  submittedDocuments?: KycDocument[];
  message?: string;
  rejectionReason?: string;
}

interface KycSnapshot {
  status: KycStatus;
  documents: KycDocument[];
  kycRequired: boolean;
  nextAction?: KycNextAction;
  redirectTo?: string;
  message?: string;
  rejectionReason?: string;
}

const KYC_STATUSES = new Set<KycStatus>(["NOT_SUBMITTED", "PENDING", "APPROVED", "REJECTED"]);
const KYC_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_KYC_FILE_SIZE = 10 * 1024 * 1024;

const initialForm: KycForm = {
  fullName: "",
  dateOfBirth: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
  documentType: "DRIVERS_LICENSE",
  documentNumber: "",
};

const normalizeKyc = (data: KycResponse, fallbackStatus: KycStatus = "NOT_SUBMITTED"): KycSnapshot => {
  const rawStatus = data.kycStatus ?? data.status;
  const status = rawStatus && KYC_STATUSES.has(rawStatus) ? rawStatus : fallbackStatus;

  return {
    status,
    documents: data.submittedDocuments ?? data.documents ?? [],
    kycRequired: data.kycRequired ?? status !== "APPROVED",
    nextAction: data.nextAction,
    redirectTo: data.redirectTo,
    message: data.message,
    rejectionReason: data.rejectionReason,
  };
};

const documentLabel = (document: KycDocument, index: number) =>
  document.fileName ?? document.name ?? document.documentType ?? document.type ?? `Document ${index + 1}`;

function SubmittedDocuments({ documents }: { documents: KycDocument[] }) {
  if (documents.length === 0) return null;

  return (
    <div className="mt-5 border-t border-border pt-5">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Submitted documents</p>
      <div className="mt-3 divide-y divide-border rounded-lg border border-border">
        {documents.map((document, index) => (
          <div
            key={document.id ?? `${documentLabel(document, index)}-${index}`}
            className="flex items-center gap-3 px-3.5 py-3"
          >
            <FileCheck2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{documentLabel(document, index)}</p>
              {(document.submittedAt || document.createdAt) && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Submitted {new Date(document.submittedAt ?? document.createdAt ?? "").toLocaleDateString()}
                </p>
              )}
            </div>
            {document.status && (
              <span className="shrink-0 text-xs font-medium text-muted-foreground">{document.status}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const Kyc = () => {
  const [form, setForm] = useState<KycForm>(initialForm);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [consented, setConsented] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<KycSnapshot | null>(null);
  const [sessionState, setSessionState] = useState<"checking" | "ready" | "sign-in">("checking");
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadKyc = useCallback(async (): Promise<KycSnapshot | null> => {
    try {
      const response = await fetch(apiUrl("/api/v1/kyc"), withCredentials);

      if (response.status === 401) {
        setSessionState("sign-in");
        return null;
      }

      if (!response.ok) {
        const apiError = await readApiError(response, "We couldn't load your verification status.");
        setError(apiError.message);
        setSessionState("ready");
        return null;
      }

      const data: KycResponse = await response.json();
      const latest = normalizeKyc(data);
      clearPostAuthRedirect();
      setSnapshot(latest);
      setSessionState("ready");
      setError("");
      return latest;
    } catch {
      setError("We couldn't reach the verification service. Check your connection and try again.");
      setSessionState("ready");
      return null;
    }
  }, []);

  useEffect(() => {
    loadKyc();
  }, [loadKyc]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadKyc();
    setRefreshing(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!consented) {
      setError("Confirm that the information is accurate before continuing.");
      return;
    }

    if (!documentFile) {
      setError("Upload a PDF, JPEG, or PNG copy of your identity document.");
      return;
    }

    if (!KYC_FILE_TYPES.has(documentFile.type)) {
      setError("Only PDF, JPEG, and PNG identity documents are accepted.");
      return;
    }

    if (documentFile.size > MAX_KYC_FILE_SIZE) {
      setError("The identity document must be 10 MB or smaller.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitKyc = async (forceCsrfRefresh: boolean) => {
        const csrf = await refreshCsrfToken(forceCsrfRefresh);
        const headers = new Headers();
        headers.set(csrf.headerName, csrf.token);
        const body = new FormData();
        body.append("file", documentFile);

        return fetch(apiUrl("/api/v1/kyc/documents"), {
          method: "POST",
          credentials: "include",
          headers,
          body,
        });
      };

      let response = await submitKyc(false);
      if (response.status === 403) {
        response = await submitKyc(true);
      }

      if (response.status === 401) {
        setPostAuthRedirect("/kyc");
        navigate("/login", { replace: true });
        return;
      }

      if (!response.ok) {
        const apiError = await readApiError(
          response,
          "We couldn't submit your verification. Please check your details.",
        );
        setError(apiError.message);
        return;
      }

      const data: KycResponse = await response.json().catch(() => ({}));
      const submitted = normalizeKyc(data, "PENDING");
      setSnapshot(submitted);
      clearPostAuthRedirect();

      const latest = await loadKyc();
      const current = latest ?? submitted;

      if (current.status === "APPROVED") {
        toast({ title: "Identity verified", description: current.message || "Your account is ready." });
        navigate(resolveAuthRedirect(current, "/dashboard"), { replace: true });
        return;
      }

      toast({
        title: current.status === "REJECTED" ? "Verification needs attention" : "Verification submitted",
        description:
          current.status === "REJECTED"
            ? current.rejectionReason || current.message || "Review your details and submit again."
            : current.message || "Your documents are now awaiting review.",
      });
    } catch {
      setError("We couldn't reach the verification service. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sessionState === "checking") {
    return (
      <AuthLayout
        title="Verify your identity"
        subtitle="Loading your latest verification status."
        back={{ to: "/", label: "Back to home" }}
      >
        <div className="flex items-center justify-center py-12" aria-busy="true">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <span className="sr-only">Loading verification status</span>
        </div>
      </AuthLayout>
    );
  }

  if (sessionState === "sign-in") {
    return (
      <AuthLayout
        title="Sign in to continue"
        subtitle="Sign in before viewing or submitting identity information."
        back={{ to: "/", label: "Back to home" }}
      >
        <button
          type="button"
          onClick={() => {
            setPostAuthRedirect("/kyc");
            navigate("/login");
          }}
          className="btn btn-primary w-full"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          Continue to sign in
        </button>
      </AuthLayout>
    );
  }

  if (snapshot?.status === "APPROVED") {
    return (
      <AuthLayout
        title="Identity verified"
        subtitle="Your verification is approved and your account is ready."
        back={{ to: "/", label: "Back to home" }}
      >
        <div className="rounded-lg border border-credit/30 bg-credit/10 p-5">
          <CheckCircle2 className="h-6 w-6 text-credit" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">KYC approved</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            You can use the banking features available on your account.
          </p>
          <SubmittedDocuments documents={snapshot.documents} />
        </div>
        <Link to="/dashboard" className="btn btn-primary mt-5 w-full">
          Continue to dashboard
        </Link>
      </AuthLayout>
    );
  }

  if (snapshot?.status === "PENDING") {
    return (
      <AuthLayout
        title="Verification in review"
        subtitle="Your documents were received and are awaiting review."
        back={{ to: "/", label: "Back to home" }}
      >
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-5">
          <ShieldCheck className="h-6 w-6 text-warning" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">KYC pending</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            No further action is required unless the review status changes.
          </p>
          <SubmittedDocuments documents={snapshot.documents} />
        </div>
        <button type="button" onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary mt-5 w-full">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
          {refreshing ? "Checking..." : "Refresh status"}
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={snapshot?.status === "REJECTED" ? "Update your verification" : "Verify your identity"}
      subtitle={
        snapshot?.status === "REJECTED"
          ? "Review the issue below, correct your details, and submit again."
          : "Complete this step to activate banking features on your account."
      }
      back={{ to: "/", label: "Back to home" }}
      footer={
        <p className="text-muted-foreground">
          Already submitted?{" "}
          <button type="button" onClick={handleRefresh} className="font-medium text-primary hover:underline">
            Refresh status
          </button>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {snapshot?.status === "REJECTED" && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Verification rejected</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                  {snapshot.rejectionReason || snapshot.message || "Review your information and submit it again."}
                </p>
              </div>
            </div>
            <SubmittedDocuments documents={snapshot.documents} />
          </div>
        )}

        <AuthError message={error} />

        <div>
          <label htmlFor="fullName" className="field-label">Full legal name</label>
          <input id="fullName" name="fullName" type="text" autoComplete="name" autoFocus required
            value={form.fullName} onChange={handleChange} className="field" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dateOfBirth" className="field-label">Date of birth</label>
            <input id="dateOfBirth" name="dateOfBirth" type="date" autoComplete="bday" required
              value={form.dateOfBirth} onChange={handleChange} className="field" />
          </div>
          <div>
            <label htmlFor="country" className="field-label">Country</label>
            <select id="country" name="country" required value={form.country} onChange={handleChange} className="field">
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="addressLine1" className="field-label">Residential address</label>
          <input id="addressLine1" name="addressLine1" type="text" autoComplete="address-line1" required
            value={form.addressLine1} onChange={handleChange} className="field" />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className="field-label">City</label>
            <input id="city" name="city" type="text" autoComplete="address-level2" required
              value={form.city} onChange={handleChange} className="field" />
          </div>
          <div>
            <label htmlFor="state" className="field-label">State</label>
            <input id="state" name="state" type="text" autoComplete="address-level1" required
              value={form.state} onChange={handleChange} className="field" />
          </div>
          <div>
            <label htmlFor="postalCode" className="field-label">ZIP code</label>
            <input id="postalCode" name="postalCode" type="text" autoComplete="postal-code" required
              value={form.postalCode} onChange={handleChange} className="field" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="documentType" className="field-label">Identity document</label>
            <select id="documentType" name="documentType" required value={form.documentType}
              onChange={handleChange} className="field">
              <option value="DRIVERS_LICENSE">Driver's license</option>
              <option value="PASSPORT">Passport</option>
              <option value="NATIONAL_ID">National ID</option>
            </select>
          </div>
          <div>
            <label htmlFor="documentNumber" className="field-label">Document number</label>
            <input id="documentNumber" name="documentNumber" type="text" autoComplete="off" required
              value={form.documentNumber} onChange={handleChange} className="field" />
          </div>
        </div>

        <div>
          <label htmlFor="documentFile" className="field-label">Document file</label>
          <label
            htmlFor="documentFile"
            className="flex min-h-24 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-input px-4 py-3 transition-colors hover:border-primary"
          >
            <FileUp className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">
                {documentFile?.name ?? "Choose a PDF, JPEG, or PNG"}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Maximum file size: 10 MB
              </span>
            </span>
          </label>
          <input
            id="documentFile"
            name="documentFile"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            required
            className="sr-only"
            onChange={(event) => {
              setDocumentFile(event.target.files?.[0] ?? null);
              setError("");
            }}
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3.5 py-3">
          <input type="checkbox" checked={consented}
            onChange={(event) => { setConsented(event.target.checked); setError(""); }}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary" />
          <span className="text-sm leading-5 text-muted-foreground">
            I confirm these details are accurate and may be used to verify my identity.
          </span>
        </label>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? "Submitting..." : snapshot?.status === "REJECTED" ? "Resubmit verification" : "Submit verification"}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          This is a demonstration application. Use test identity information only.
        </p>
      </form>
    </AuthLayout>
  );
};

export default Kyc;
