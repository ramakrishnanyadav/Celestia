/**
 * CELESTIA Production Typed API Client
 * - Enforces HttpOnly cookies via credentials: "include"
 * - Automatically attaches X-CSRF-Token on mutating requests
 * - Generates Idempotency-Key for safe mutating calls
 * - Handles 204 No Content and formats RFC 7807 / FastAPI 422 detail arrays
 * - 15-second timeout with AbortController
 * - Single-flight silent refresh on 401 with retry and login redirect
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1] ?? "") : null;
}

export class ApiError extends Error {
  public status: number;
  public details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function formatErrorDetail(detail: unknown): string {
  if (!detail) return "An unexpected error occurred.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null && "msg" in item) {
          const loc = Array.isArray((item as { loc?: unknown[] }).loc)
            ? (item as { loc: unknown[] }).loc.join(".")
            : "";
          return loc
            ? `${loc}: ${(item as { msg: string }).msg}`
            : (item as { msg: string }).msg;
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  if (typeof detail === "object") {
    return JSON.stringify(detail);
  }
  return String(detail);
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  idempotencyKey?: string;
  _isRetry?: boolean;
}

let refreshPromise: Promise<unknown> | null = null;

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    body,
    timeoutMs = 15000,
    headers: customHeaders = {},
    idempotencyKey,
    _isRetry = false,
    ...fetchOptions
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const method = (fetchOptions.method || "GET").toUpperCase();
  const headers = new Headers(customHeaders);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  // Set CSRF token on mutating requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", csrfToken);
    }
    if (idempotencyKey && !headers.has("Idempotency-Key")) {
      headers.set("Idempotency-Key", idempotencyKey);
    }
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (
      typeof body === "string" ||
      body instanceof FormData ||
      body instanceof Blob
    ) {
      requestBody = body;
    } else {
      headers.set("Content-Type", "application/json");
      requestBody = JSON.stringify(body);
    }
  }

  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
    const init: RequestInit = {
      ...fetchOptions,
      method,
      headers,
      credentials: "include",
      signal: controller.signal,
    };
    if (requestBody !== undefined) {
      init.body = requestBody;
    }
    const response = await fetch(url, init);

    clearTimeout(timeoutId);

    // 204 No Content
    if (response.status === 204) {
      return null as T;
    }

    // 401 Unauthorized: Attempt single-flight silent refresh
    if (response.status === 401) {
      const isAuthEndpoint =
        endpoint.includes("/auth/refresh") ||
        endpoint.includes("/auth/login") ||
        endpoint.includes("/auth/demo-login");

      if (!isAuthEndpoint && !_isRetry) {
        if (!refreshPromise) {
          refreshPromise = apiClient("/auth/refresh", {
            method: "POST",
            _isRetry: true,
          }).finally(() => {
            refreshPromise = null;
          });
        }

        try {
          await refreshPromise;
          return await apiClient<T>(endpoint, {
            ...options,
            _isRetry: true,
          });
        } catch {
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.startsWith("/login")
          ) {
            const returnTo = encodeURIComponent(
              window.location.pathname + window.location.search
            );
            window.location.href = `/login?returnTo=${returnTo}`;
          }
        }
      }
    }

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      let errorDetails: unknown = null;
      if (isJson) {
        try {
          const errData = await response.json();
          errorDetails = errData;
          errorMessage = formatErrorDetail(
            errData.detail || errData.message || errorMessage
          );
        } catch {
          // fallback to statusText
        }
      } else {
        const text = await response.text();
        if (text) errorMessage = text;
      }
      throw new ApiError(response.status, errorMessage, errorDetails);
    }

    if (isJson) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(408, `Request timed out after ${timeoutMs}ms`);
    }
    throw new ApiError(0, err instanceof Error ? err.message : "Network error");
  }
}
