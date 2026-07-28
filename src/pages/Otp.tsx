import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ShieldCheck, TerminalSquare } from "lucide-react";
import { AuthLayout, AuthError } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, jsonPost, withCredentials } from "@/lib/api";
import { consumePostAuthRedirect, OnboardingContract, resolveRoleAwareRedirect } from "@/lib/auth-flow";
import { refreshCsrfToken } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;
const EMPTY_CODE = Array<string>(CODE_LENGTH).fill("");

const Otp = () => {
  const [otp, setOtp] = useState<string[]>(EMPTY_CODE);
  const [purpose, setPurpose] = useState<"LOGIN" | "PASSWORD_RESET">("LOGIN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const code = otp.join("");
  const complete = code.length === CODE_LENGTH;

  useEffect(() => {
    const storedPurpose = localStorage.getItem("otpPurpose") as "LOGIN" | "PASSWORD_RESET";
    if (storedPurpose) setPurpose(storedPurpose);
    const storedOtp = localStorage.getItem("pendingOtp");
    if (storedOtp) {
      setDevOtp(storedOtp);
      localStorage.removeItem("pendingOtp");
    } else {
      fetchDevOtp(storedPurpose || "LOGIN");
    }
    inputRefs.current[0]?.focus();
  }, []);

  const fetchDevOtp = async (currentPurpose: string) => {
    try {
      const username = localStorage.getItem("pendingUsername") ?? "";
      const params = new URLSearchParams({ purpose: currentPurpose });
      if (username) params.set("username", username);

      // Try the primary endpoint first, fall back to the dev-only alias
      let response = await fetch(apiUrl(`/api/v1/auth/get-otp?${params}`), withCredentials);
      if (response.status === 403 || response.status === 401) {
        response = await fetch(apiUrl(`/api/v1/auth/dev/otp?${params}`), withCredentials);
      }

      if (response.ok) {
        const data = await response.json();
        setDevOtp(data.otp ?? data.code ?? data.otpCode ?? data.value ?? null);
      } else {
        setDevOtp(null);
      }
    } catch {
      setDevOtp(null);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];

    if (value.length > 1) {
      // Pasting the whole code into any box should fill from that box onward.
      const pasted = value.slice(0, CODE_LENGTH).split("");
      pasted.forEach((char, i) => {
        if (index + i < CODE_LENGTH) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      inputRefs.current[Math.min(index + pasted.length, CODE_LENGTH - 1)]?.focus();
    } else {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    if (error) setError("");
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const fillCode = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
    if (digits.length === 0) return;
    const next = [...EMPTY_CODE];
    digits.forEach((d, i) => (next[i] = d));
    setOtp(next);
    inputRefs.current[Math.min(digits.length, CODE_LENGTH - 1)]?.focus();
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complete) {
      setError("Enter all six digits.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let endpoint: string;
      let body: unknown;

      if (purpose === "LOGIN") {
        endpoint = apiUrl("/api/v1/auth/verify-otp");
        // Backend versions have used each of these field names.
        body = { code, otp: code, otpCode: code, purpose: "LOGIN" };
      } else {
        const email = localStorage.getItem("resetEmail");
        const newPassword = localStorage.getItem("newPassword");
        endpoint = apiUrl("/api/v1/auth/confirm-password-reset");
        body = { email, code, newPassword };
      }

      const response = await fetch(endpoint, jsonPost(body));

      if (response.ok) {
        let redirectTo = "/login";
        if (purpose === "LOGIN") {
          const data: OnboardingContract = await response.json();
          redirectTo = await resolveRoleAwareRedirect(data, consumePostAuthRedirect());
          if (redirectTo.startsWith("/admin")) {
            await refreshCsrfToken(true).catch(() => undefined);
          }
        }
        toast({
          title: purpose === "LOGIN" ? "Verified" : "Password updated",
          description: purpose === "LOGIN" ? "You're signed in." : "Sign in with your new password.",
        });
        localStorage.removeItem("otpPurpose");
        localStorage.removeItem("resetEmail");
        localStorage.removeItem("newPassword");
        navigate(redirectTo);
      } else if (response.status === 400) {
        setError("That code is incorrect or has expired.");
        setOtp(EMPTY_CODE);
        inputRefs.current[0]?.focus();
      } else {
        setError("We couldn't verify that code. Please try again.");
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Enter your code"
      subtitle={
        purpose === "LOGIN"
          ? "We sent a six-digit code to the email on your account."
          : "Enter the six-digit code to confirm your new password."
      }
      back={purpose === "LOGIN" ? { to: "/login", label: "Back to sign in" } : { to: "/reset-password", label: "Back" }}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Only rendered when the backend chooses to expose it, which it does
            in development. Labelled plainly so it can't be mistaken for a
            product feature. */}
        {devOtp && (
          <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-3">
            <TerminalSquare className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-[13px] font-medium">Development mode</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your code is{" "}
                <button
                  type="button"
                  onClick={() => fillCode(devOtp)}
                  className="tabular font-semibold tracking-[0.12em] text-foreground underline underline-offset-2"
                >
                  {devOtp}
                </button>{" "}
                - click to fill.
              </p>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="otp-0" className="field-label">
            Verification code
          </label>

          <div className="flex gap-2 sm:gap-2.5">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={CODE_LENGTH}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.currentTarget.select()}
                aria-label={`Digit ${index + 1}`}
                aria-invalid={Boolean(error)}
                className={cn(
                  "tabular h-14 w-full rounded-lg border bg-background text-center text-xl font-semibold",
                  "transition-[border-color,box-shadow] duration-150 focus:outline-none",
                  "focus:border-primary focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.16)]",
                  error ? "border-destructive" : digit ? "border-border-strong" : "border-input",
                )}
              />
            ))}
          </div>
        </div>

        <AuthError message={error} />

        <button type="submit" disabled={loading || !complete} className="btn btn-primary w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? "Verifying..." : "Verify and continue"}
        </button>

        <p className="text-center text-[13px] text-muted-foreground">
          Codes expire a few minutes after they're sent.
        </p>
      </form>
    </AuthLayout>
  );
};

export default Otp;
