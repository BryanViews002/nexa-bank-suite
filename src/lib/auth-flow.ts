import { apiUrl, withCredentials } from "@/lib/api";

const POST_AUTH_REDIRECT_KEY = "nexa:post-auth-redirect";

const isLocalRoute = (route: string) => route.startsWith("/") && !route.startsWith("//");

export type KycStatus = "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
export type KycNextAction = "COMPLETE_KYC" | "AWAIT_KYC_REVIEW" | "CONTINUE";

export interface OnboardingContract {
  kycStatus?: KycStatus;
  kycRequired?: boolean;
  nextAction?: KycNextAction;
  redirectTo?: string;
}

interface AuthenticatedProfile {
  role?: string;
}

export function setPostAuthRedirect(route: string) {
  if (isLocalRoute(route)) sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, route);
}

export function consumePostAuthRedirect(fallback = "/dashboard") {
  const route = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
  return route && isLocalRoute(route) ? route : fallback;
}

export function clearPostAuthRedirect() {
  sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
}

export function clearAuthenticationStorage() {
  clearPostAuthRedirect();
  [
    "pendingOtp",
    "otpPurpose",
    "pendingUsername",
    "resetEmail",
    "newPassword",
  ].forEach((key) => localStorage.removeItem(key));
}

export function resolveAuthRedirect(contract: OnboardingContract, fallback = "/dashboard") {
  clearPostAuthRedirect();
  if (contract.redirectTo && isLocalRoute(contract.redirectTo)) return contract.redirectTo;
  if (contract.kycRequired || (contract.kycStatus && contract.kycStatus !== "APPROVED")) return "/kyc";
  return fallback;
}

export async function resolveRoleAwareRedirect(
  contract: OnboardingContract,
  fallback = "/dashboard",
) {
  try {
    const response = await fetch(apiUrl("/api/v1/profile"), withCredentials);
    if (response.ok) {
      const profile = (await response.json()) as AuthenticatedProfile;
      if (profile.role === "ROLE_ADMIN") {
        clearPostAuthRedirect();
        return fallback.startsWith("/admin") ? fallback : "/admin";
      }
    }
  } catch {
    // The protected route performs the authoritative session check.
  }

  return resolveAuthRedirect(contract, fallback);
}
