import { apiUrl } from "@/lib/api";
import { ApiValidationError } from "@/lib/admin-types";

export const ADMIN_SECURITY_EVENT = "nexa:admin-security";

interface CsrfToken {
  headerName: string;
  parameterName: string;
  token: string;
}

interface AdminRequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_ERROR_CODES = new Set([
  "CSRF_INVALID",
  "CSRF_REQUIRED",
  "CSRF_TOKEN_INVALID",
  "INVALID_CSRF_TOKEN",
]);

let csrfToken: CsrfToken | null = null;
let csrfRequest: Promise<CsrfToken> | null = null;

export class AdminApiError extends Error implements ApiValidationError {
  code: string;
  status: number;
  path?: string;
  timestamp?: string;
  fieldErrors: Record<string, string>;
  details?: Record<string, unknown>;

  constructor(payload: Partial<ApiValidationError> & { message: string; status: number }) {
    super(payload.message);
    this.name = "AdminApiError";
    this.code = payload.code ?? "REQUEST_FAILED";
    this.status = payload.status;
    this.path = payload.path;
    this.timestamp = payload.timestamp;
    this.fieldErrors = payload.fieldErrors ?? {};
    this.details = payload.details;
  }
}

const emitSecurityEvent = (error: AdminApiError) => {
  if (
    error.status === 401 ||
    error.status === 423 ||
    (error.status === 403 && error.code === "ACCESS_DENIED")
  ) {
    window.dispatchEvent(new CustomEvent(ADMIN_SECURITY_EVENT, { detail: error }));
  }
};

async function parseAdminError(response: Response): Promise<AdminApiError> {
  try {
    const payload = await response.clone().json();
    return new AdminApiError({
      code: typeof payload?.code === "string" ? payload.code : "REQUEST_FAILED",
      message:
        typeof payload?.message === "string" && payload.message.trim()
          ? payload.message
          : response.statusText || "The request could not be completed.",
      status: typeof payload?.status === "number" ? payload.status : response.status,
      path: typeof payload?.path === "string" ? payload.path : undefined,
      timestamp: typeof payload?.timestamp === "string" ? payload.timestamp : undefined,
      fieldErrors:
        payload?.fieldErrors && typeof payload.fieldErrors === "object"
          ? payload.fieldErrors
          : {},
      details:
        payload?.details && typeof payload.details === "object"
          ? payload.details
          : undefined,
    });
  } catch {
    return new AdminApiError({
      code: "REQUEST_FAILED",
      message: response.statusText || "The request could not be completed.",
      status: response.status,
    });
  }
}

const isCsrfError = (error: AdminApiError) =>
  error.status === 403 &&
  (CSRF_ERROR_CODES.has(error.code) || error.message.toLowerCase().includes("csrf"));

export function clearAdminSessionState() {
  csrfToken = null;
  csrfRequest = null;
}

export async function refreshCsrfToken(force = true): Promise<CsrfToken> {
  if (!force && csrfToken) return csrfToken;
  if (!force && csrfRequest) return csrfRequest;

  csrfRequest = fetch(apiUrl("/api/v1/auth/csrf"), { credentials: "include" })
    .then(async (response) => {
      if (!response.ok) {
        const error = await parseAdminError(response);
        emitSecurityEvent(error);
        throw error;
      }
      const token = (await response.json()) as CsrfToken;
      csrfToken = token;
      return token;
    })
    .finally(() => {
      csrfRequest = null;
    });

  return csrfRequest;
}

async function executeAdminRequest<T>(
  path: string,
  options: AdminRequestOptions,
  allowCsrfRetry: boolean,
): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers(options.headers);

  if (MUTATION_METHODS.has(method)) {
    const token = await refreshCsrfToken(false);
    headers.set(token.headerName, token.token);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
  }

  const response = await fetch(apiUrl(path), {
    method,
    credentials: "include",
    headers,
    body,
    signal: options.signal,
  });

  if (!response.ok) {
    const error = await parseAdminError(response);
    if (allowCsrfRetry && MUTATION_METHODS.has(method) && isCsrfError(error)) {
      await refreshCsrfToken(true);
      return executeAdminRequest<T>(path, options, false);
    }
    emitSecurityEvent(error);
    throw error;
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") ?? "";
  const responseBody = await response.text();
  if (!responseBody) return undefined as T;
  if (contentType.includes("application/json")) return JSON.parse(responseBody) as T;
  return responseBody as T;
}

export function adminRequest<T>(path: string, options: AdminRequestOptions = {}) {
  return executeAdminRequest<T>(path, options, true);
}

export async function adminBlob(path: string): Promise<{ blob: Blob; filename?: string }> {
  const response = await fetch(apiUrl(path), { credentials: "include" });
  if (!response.ok) {
    const error = await parseAdminError(response);
    emitSecurityEvent(error);
    throw error;
  }

  const disposition = response.headers.get("content-disposition");
  const filename = disposition?.match(/filename="?([^"]+)"?/i)?.[1];
  return { blob: await response.blob(), filename };
}
