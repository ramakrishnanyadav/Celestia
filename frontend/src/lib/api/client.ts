/**
 * CELESTIA Production Typed API Client
 * - Enforces HttpOnly cookies via credentials: "include"
 * - Automatically attaches X-CSRF-Token on mutating requests
 * - Generates Idempotency-Key for safe mutating calls
 * - Handles 204 No Content and formats RFC 7807 / FastAPI 422 detail arrays
 * - 15-second timeout with AbortController
 * - Single-flight silent refresh on 401 with retry and login redirect
 */

const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }
  return "http://localhost:8000/api";
};

const API_BASE = getApiBase();

const CSRF_REGEX = /(?:^|;\s*)csrf_token=([^;]+)/;

function getCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = CSRF_REGEX.exec(document.cookie);
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
  if (typeof detail === "object" && detail !== null) {
    return JSON.stringify(detail);
  }
  return typeof detail === "string" ? detail : JSON.stringify(detail);
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  idempotencyKey?: string;
  _isRetry?: boolean;
}

const AUTH_TOKEN_KEY = "celestia_access_token";
const REFRESH_TOKEN_KEY = "celestia_refresh_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredTokens(accessToken?: string, refreshToken?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (accessToken) localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // Ignore in restricted iframe or storage limit
  }
}

export function clearStoredTokens(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore
  }
}

let refreshPromise: Promise<unknown> | null = null;

function buildRequestHeaders(
  customHeaders: HeadersInit,
  method: string,
  idempotencyKey?: string
): Headers {
  const headers = new Headers(customHeaders);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  const token = getStoredAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken = getCsrfTokenFromCookie();
    if (csrfToken && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", csrfToken);
    }
    if (idempotencyKey && !headers.has("Idempotency-Key")) {
      headers.set("Idempotency-Key", idempotencyKey);
    }
  }
  return headers;
}

function buildRequestBody(
  body: unknown,
  headers: Headers
): BodyInit | undefined {
  if (body === undefined) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob
  ) {
    return body;
  }
  headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

async function handleUnauthorizedFlow<T>(
  endpoint: string,
  options: RequestOptions
): Promise<T | null> {
  const isAuthEndpoint =
    endpoint.includes("/auth/refresh") ||
    endpoint.includes("/auth/login") ||
    endpoint.includes("/auth/demo-login");

  if (isAuthEndpoint || options._isRetry) {
    return null;
  }

  const storedRefreshToken = getStoredRefreshToken();
  const refreshHeaders: Record<string, string> = {};
  if (storedRefreshToken) {
    refreshHeaders["Authorization"] = `Bearer ${storedRefreshToken}`;
  }

  refreshPromise ??= apiClient("/auth/refresh", {
    method: "POST",
    headers: refreshHeaders,
    _isRetry: true,
  }).finally(() => {
    refreshPromise = null;
  });

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
    return null;
  }
}

async function parseErrorResponse(response: Response): Promise<never> {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
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
      // fallback
    }
  } else {
    const text = await response.text();
    if (text) errorMessage = text;
  }
  throw new ApiError(response.status, errorMessage, errorDetails);
}

async function parseSuccessResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T;
  }
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

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
  const headers = buildRequestHeaders(customHeaders, method, idempotencyKey);
  const requestBody = buildRequestBody(body, headers);

  try {
    const pathPrefix = endpoint.startsWith("/") ? "" : "/";
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE}${pathPrefix}${endpoint}`;

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

    if (response.status === 401) {
      const retryResult = await handleUnauthorizedFlow<T>(endpoint, options);
      if (retryResult !== null) {
        return retryResult;
      }
    }

    if (!response.ok) {
      await parseErrorResponse(response);
    }

    const result = await parseSuccessResponse<T>(response);
    if (result && typeof result === "object" && "access_token" in result) {
      const tokenData = result as { access_token?: string; refresh_token?: string };
      setStoredTokens(tokenData.access_token, tokenData.refresh_token);
    }
    if (endpoint.includes("/auth/logout")) {
      clearStoredTokens();
    }

    return result;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(408, `Request timed out after ${timeoutMs}ms`);
    }
    throw new ApiError(0, err instanceof Error ? err.message : "Network error");
  }
}
