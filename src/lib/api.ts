/**
 * Single source of truth for the backend origin.
 *
 * The default is unchanged from what every call site previously hardcoded, so
 * behaviour is identical out of the box. Set VITE_API_URL in a .env file to
 * point at a deployed backend without touching component code.
 */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8080").replace(/\/+$/, "");

/** Builds an absolute backend URL from a leading-slash path. */
export const apiUrl = (path: string) => `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

/**
 * The session lives in a cookie set by the Spring Boot backend, so every
 * request has to opt into sending credentials cross-origin.
 */
export const withCredentials: RequestInit = { credentials: "include" };

/** Shorthand for the JSON POST shape used by every mutating endpoint here. */
export const jsonPost = (body: unknown): RequestInit => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify(body),
});

export interface ApiErrorBody {
  code?: string;
  message: string;
}

export async function readApiError(response: Response, fallback: string): Promise<ApiErrorBody> {
  try {
    const data = await response.clone().json();
    return {
      code: typeof data?.code === "string" ? data.code : undefined,
      message:
        typeof data?.message === "string" && data.message.trim()
          ? data.message
          : fallback,
    };
  } catch {
    return { message: fallback };
  }
}

/**
 * Reads an error message out of a failed response, tolerating endpoints that
 * return an empty body or HTML instead of the documented JSON envelope.
 */
export async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.clone().json();
    if (data && typeof data.message === "string" && data.message.trim()) return data.message;
  } catch {
    // Non-JSON body — fall through.
  }
  return fallback;
}
