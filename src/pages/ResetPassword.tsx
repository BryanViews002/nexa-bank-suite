import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { AuthLayout, AuthError } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, jsonPost, readError } from "@/lib/api";
import { cn } from "@/lib/utils";

type Step = "email" | "password";

const ResetPassword = () => {
  const [step, setStep] = useState<Step>("email");
  const [formData, setFormData] = useState({ email: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/v1/auth/request-password-reset"), jsonPost({ email: formData.email }));
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Code sent",
          description: data.message || `Check ${formData.email} for your code.`,
        });
        setStep("password");
      } else {
        setError(await readError(response, "We couldn't send a code to that address."));
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // The new password is only committed once the code is verified on the OTP
    // screen, so it's staged here and confirmed there in a single request.
    localStorage.setItem("resetEmail", formData.email);
    localStorage.setItem("newPassword", formData.newPassword);
    localStorage.setItem("otpPurpose", "PASSWORD_RESET");

    navigate("/otp");
  };

  return (
    <AuthLayout
      title={step === "email" ? "Reset your password" : "Choose a new password"}
      subtitle={
        step === "email"
          ? "We'll email you a six-digit code to confirm it's you."
          : "You'll confirm this with the code we just sent."
      }
      back={
        step === "email"
          ? { to: "/login", label: "Back to sign in" }
          : { to: "/login", label: "Back to sign in" }
      }
      footer={
        step === "email" ? (
          <p className="text-muted-foreground">
            Remembered it?{" "}
            <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        ) : undefined
      }
    >
      {/* Two-step progress. Explicit steps stop the flow feeling like it jumped
          somewhere unexpected when the form swaps out. */}
      <div className="mb-7 flex items-center gap-2" aria-hidden="true">
        {(["email", "password"] as const).map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                step === "password" || i === 0 ? "bg-primary" : "bg-border",
              )}
            />
          </div>
        ))}
        <span className="text-xs font-medium text-muted-foreground">Step {step === "email" ? 1 : 2} of 2</span>
      </div>

      {step === "email" ? (
        <form onSubmit={handleEmailSubmit} className="space-y-5" noValidate>
          <AuthError message={error} />

          <div>
            <label htmlFor="email" className="field-label">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              className="field"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />
            <p className="field-hint">Use the address on your Nexa account.</p>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-5" noValidate>
          <div className="flex items-start gap-3 rounded-lg border border-credit/25 bg-credit-muted px-3.5 py-3">
            <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-credit" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed">
              Code sent to <span className="font-medium">{formData.email}</span>
            </p>
          </div>

          <AuthError message={error} />

          <div>
            <label htmlFor="newPassword" className="field-label">
              New password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                autoFocus
                required
                className="field pr-11"
                placeholder="Create a new password"
                value={formData.newPassword}
                onChange={handleInputChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <button type="submit" className="btn btn-primary w-full">
              Continue to verification
            </button>
            <button type="button" onClick={() => setStep("email")} className="btn btn-ghost w-full">
              Use a different email
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPassword;
