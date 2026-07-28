import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout, AuthError } from "@/components/layout/AuthLayout";
import { useToast } from "@/hooks/use-toast";
import { apiUrl, jsonPost, readError } from "@/lib/api";
import {
  consumePostAuthRedirect,
  OnboardingContract,
  resolveRoleAwareRedirect,
  setPostAuthRedirect,
} from "@/lib/auth-flow";
import { refreshCsrfToken } from "@/lib/admin-api";

interface LoginForm {
  username: string;
  password: string;
}

interface LoginResponse extends OnboardingContract {
  message: string;
  needMfa?: boolean;
  requiresMFA?: boolean;
  sessionId?: string;
  otp?: string;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginForm>({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
      const response = await fetch(apiUrl("/api/v1/auth/login"), jsonPost(formData));

      if (response.ok) {
        const data: LoginResponse = await response.json();

        // Backend returns either `needMfa` or `requiresMFA` depending on version
        if (data.needMfa || data.requiresMFA) {
          if (data.otp) localStorage.setItem("pendingOtp", data.otp);
          localStorage.setItem("otpPurpose", "LOGIN");
          localStorage.setItem("pendingUsername", formData.username);
          if (data.redirectTo) setPostAuthRedirect(data.redirectTo);
          navigate("/otp", { state: { sessionId: data.sessionId } });
        } else {
          const redirectTo = await resolveRoleAwareRedirect(data, consumePostAuthRedirect());
          if (redirectTo.startsWith("/admin")) {
            await refreshCsrfToken(true).catch(() => undefined);
          }
          toast({ title: "Welcome back", description: "You're signed in." });
          navigate(redirectTo);
        }
      } else {
        setError(await readError(response, "That username or password doesn't match our records."));
      }
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Enter your details to reach your dashboard."
      back={{ to: "/", label: "Back to home" }}
      footer={
        <p className="text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Open one
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthError message={error} />

        <div>
          <label htmlFor="username" className="field-label">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            autoFocus
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Your username"
            required
            aria-invalid={Boolean(error)}
            className="field"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <Link
              to="/reset-password"
              className="mb-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Forgot?
            </Link>
          </div>

          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Your password"
              required
              aria-invalid={Boolean(error)}
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
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
