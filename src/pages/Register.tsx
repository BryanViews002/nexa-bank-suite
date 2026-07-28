import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout, AuthError } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, jsonPost, readError } from "@/lib/api";
import { OnboardingContract, resolveAuthRedirect } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

interface RegisterForm {
  fullName: string;
  username: string;
  email: string;
  password: string;
}

/**
 * Advisory only — the backend remains the authority on what it accepts. This
 * exists so the user sees the requirements while typing rather than being told
 * after a round trip.
 */
const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /\d/.test(v) },
];

const STRENGTH_LABELS = ["Too short", "Weak", "Good", "Strong"] as const;
const STRENGTH_STYLES = ["bg-destructive", "bg-destructive", "bg-warning", "bg-credit"] as const;

const Register = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    fullName: "",
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const passed = useMemo(() => RULES.map((rule) => rule.test(formData.password)), [formData.password]);
  const score = passed.filter(Boolean).length;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/v1/auth/register"), jsonPost(formData));

      if (response.ok) {
        const data: OnboardingContract & { message?: string } = await response.json();
        toast({
          title: "Account created",
          description: data.nextAction === "CONTINUE" ? "Your account is ready." : "Next, verify your identity.",
        });
        navigate(resolveAuthRedirect(data, "/kyc"));
      } else if (response.status === 409) {
        setError("That username or email is already registered. Try signing in instead.");
      } else {
        setError(await readError(response, "We couldn't create your account. Please check your details."));
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Open your account"
      subtitle="Takes about a minute. No minimum balance."
      back={{ to: "/", label: "Back to home" }}
      footer={
        <p className="text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthError message={error} />

        <div>
          <label htmlFor="fullName" className="field-label">
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            autoFocus
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Jordan Ellis"
            required
            className="field"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="username" className="field-label">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="jordan"
              required
              className="field"
            />
            <p className="field-hint">Others use this to send you money.</p>
          </div>

          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="jordan@example.com"
              required
              className="field"
            />
            <p className="field-hint">Used for security codes.</p>
          </div>
        </div>

        <div>
          <label htmlFor="password" className="field-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              required
              className="field pr-11"
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

          {formData.password.length > 0 && (
            <div className="mt-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {RULES.map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-300",
                        i < score ? STRENGTH_STYLES[score] : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs font-medium text-muted-foreground">{STRENGTH_LABELS[score]}</span>
              </div>

              <ul className="mt-2.5 space-y-1">
                {RULES.map((rule, i) => (
                  <li
                    key={rule.label}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors",
                      passed[i] ? "text-credit" : "text-muted-foreground",
                    )}
                  >
                    <Check
                      className={cn("h-3 w-3 transition-opacity", passed[i] ? "opacity-100" : "opacity-35")}
                      strokeWidth={3}
                      aria-hidden="true"
                    />
                    {rule.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          This is a demonstration application. Please don't enter real banking credentials.
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
