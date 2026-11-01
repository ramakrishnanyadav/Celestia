// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError, formatErrorDetail } from "./client";

describe("formatErrorDetail", () => {
  it("formats null or empty detail safely", () => {
    expect(formatErrorDetail(null)).toBe("An unexpected error occurred.");
    expect(formatErrorDetail("")).toBe("An unexpected error occurred.");
  });

  it("returns plain string errors untouched", () => {
    expect(formatErrorDetail("Invalid credentials")).toBe("Invalid credentials");
  });

  it("formats FastAPI 422 validation error arrays with locations and messages", () => {
    const errorArray = [
      { loc: ["body", "budget_minor"], msg: "Input should be greater than or equal to 1000000" },
      { loc: ["body", "guest_count"], msg: "Field required" },
    ];
    expect(formatErrorDetail(errorArray)).toBe(
      "body.budget_minor: Input should be greater than or equal to 1000000; body.guest_count: Field required"
    );
  });

  it("formats nested object details", () => {
    expect(formatErrorDetail({ code: "ERR_LOCKED", reason: "Resource is busy" })).toBe(
      '{"code":"ERR_LOCKED","reason":"Resource is busy"}'
    );
  });
});

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    document.cookie = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles 204 No Content by returning null", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 204, statusText: "No Content" })
    );

    const res = await apiClient("/events/123", { method: "DELETE" });
    expect(res).toBeNull();
  });

  it("attaches X-CSRF-Token and Idempotency-Key headers on mutating requests", async () => {
    document.cookie = "csrf_token=test-csrf-secret-999; path=/";

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    await apiClient("/events", {
      method: "POST",
      body: { title: "Test Gala" },
      idempotencyKey: "idem-key-1234",
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get("X-CSRF-Token")).toBe("test-csrf-secret-999");
    expect(headers.get("Idempotency-Key")).toBe("idem-key-1234");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("throws ApiError with formatted detail on FastAPI 422 validation failure", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          detail: [{ loc: ["body", "title"], msg: "String should have at least 1 character" }],
        }),
        {
          status: 422,
          statusText: "Unprocessable Entity",
          headers: { "Content-Type": "application/json" },
        }
      )
    );

    await expect(
      apiClient("/events", {
        method: "POST",
        body: { title: "" },
      })
    ).rejects.toThrowError("body.title: String should have at least 1 character");
  });

  it("throws 408 on timeout via AbortController", async () => {
    vi.mocked(fetch).mockImplementationOnce((_url, init) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          init.signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    });

    await expect(
      apiClient("/heavy-computation", { timeoutMs: 50 })
    ).rejects.toThrow("Request timed out after 50ms");
  });

  it("performs single-flight silent token refresh on 401 and retries original request", async () => {
    // 1st request -> 401
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    );
    // 2nd request -> refresh call /auth/refresh returns 200
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ access_token: "new-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    // 3rd request -> retried original request returns 200
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "evt-123", title: "Refreshed Event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    const result = await apiClient<{ id: string; title: string }>("/events/evt-123");
    expect(result).toEqual({ id: "evt-123", title: "Refreshed Event" });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("handles plain text error response gracefully", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response("Gateway timeout from upstream proxy", {
        status: 504,
        statusText: "Gateway Timeout",
        headers: { "Content-Type": "text/plain" },
      })
    );

    await expect(apiClient("/slow-upstream")).rejects.toThrow(
      "Gateway timeout from upstream proxy"
    );
  });
});
