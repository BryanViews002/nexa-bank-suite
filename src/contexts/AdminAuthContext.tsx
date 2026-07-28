import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, LockKeyhole, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ADMIN_SECURITY_EVENT,
  AdminApiError,
  adminRequest,
  clearAdminSessionState,
  refreshCsrfToken,
} from "@/lib/admin-api";
import { AdminProfile } from "@/lib/admin-types";
import { clearAuthenticationStorage, setPostAuthRedirect } from "@/lib/auth-flow";

interface AdminAuthValue {
  profile: AdminProfile;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "locked" | "error">("loading");
  const [lockedMessage, setLockedMessage] = useState("This administrator account is locked.");
  const [errorMessage, setErrorMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onSecurityEvent = (event: Event) => {
      const error = (event as CustomEvent<AdminApiError>).detail;
      if (error.status === 401 || error.code === "UNAUTHENTICATED") {
        clearAdminSessionState();
        clearAuthenticationStorage();
        setProfile(null);
        setPostAuthRedirect(`${location.pathname}${location.search}`);
        navigate("/login", { replace: true });
        return;
      }
      if (error.status === 423 || error.code === "ACCOUNT_LOCKED") {
        setLockedMessage(error.message);
        setStatus("locked");
        return;
      }
      if (error.status === 403 && error.code === "ACCESS_DENIED") {
        toast.error(error.message || "Administrator access is required.");
        setProfile(null);
        navigate("/dashboard", { replace: true });
      }
    };

    window.addEventListener(ADMIN_SECURITY_EVENT, onSecurityEvent);
    return () => window.removeEventListener(ADMIN_SECURITY_EVENT, onSecurityEvent);
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    let active = true;

    const verifyRole = async () => {
      setStatus("loading");
      setErrorMessage("");
      try {
        const current = await adminRequest<AdminProfile>("/api/v1/profile");
        if (!active) return;
        if (current.role !== "ROLE_ADMIN") {
          toast.error("Administrator access is required.");
          navigate("/dashboard", { replace: true });
          return;
        }
        setProfile(current);
        setStatus("ready");
        refreshCsrfToken(true).catch(() => undefined);
      } catch (error) {
        if (!active) return;
        if (!(error instanceof AdminApiError)) {
          setErrorMessage(error instanceof Error ? error.message : "The access check could not be completed.");
          setStatus("error");
          return;
        }
        if (
          error.status !== 401 &&
          error.status !== 423 &&
          !(error.status === 403 && error.code === "ACCESS_DENIED")
        ) {
          setErrorMessage(error.message);
          setStatus("error");
        }
      }
    };

    verifyRole();
    return () => {
      active = false;
    };
  }, [navigate, retryKey]);

  const logout = useCallback(async () => {
    try {
      await adminRequest<void>("/api/v1/auth/logout", { method: "POST" });
    } catch (error) {
      if (!(error instanceof AdminApiError) || error.status !== 401) {
        toast.error(error instanceof Error ? error.message : "Sign out failed.");
        return;
      }
    }

    clearAdminSessionState();
    clearAuthenticationStorage();
    setProfile(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const value = useMemo(() => (profile ? { profile, logout } : null), [logout, profile]);

  if (status === "locked") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6">
          <LockKeyhole className="h-6 w-6 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold">Account locked</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{lockedMessage}</p>
          <button type="button" onClick={logout} className="btn btn-secondary mt-6 w-full">
            Return to sign in
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-6">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6">
          <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-semibold">Access check failed</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{errorMessage}</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="btn btn-secondary mt-6 w-full"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading" || !value) {
    return (
      <div className="grid min-h-screen place-items-center bg-background" aria-busy="true">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
          Verifying administrator access
        </div>
      </div>
    );
  }

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const value = useContext(AdminAuthContext);
  if (!value) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return value;
}
