import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import {
  api,
  ApiError,
  csrfToken,
  errorMessage,
  resetCsrf,
  setUnauthorizedHandler,
} from "../shared/api/client";
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => resetCsrf());
afterEach(() => {
  vi.unstubAllGlobals();
  setUnauthorizedHandler(() => {});
});
describe("cookie and CSRF contract", () => {
  it("deduplicates concurrent CSRF requests and sends cookies", async () => {
    const fetcher = vi.fn().mockResolvedValue(reply({ csrf_token: "one" }));
    vi.stubGlobal("fetch", fetcher);
    expect(await Promise.all([csrfToken(), csrfToken()])).toEqual(["one", "one"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].credentials).toBe("include");
  });
  it("uses the rotated token for the next mutation", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({ csrf_token: "before" }))
      .mockResolvedValueOnce(reply({ csrf_token: "after" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await api.mutate("/auth/login", "POST", {
      email: "qa@example.test",
      password: "test-only",
    });
    await api.mutate("/auth/logout", "POST");
    expect(fetcher.mock.calls[1][1].headers["X-CSRF-Token"]).toBe("before");
    expect(fetcher.mock.calls[2][1].headers["X-CSRF-Token"]).toBe("after");
  });
  it("never retries a rejected write and obtains a fresh token next time", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({ csrf_token: "old" }))
      .mockResolvedValueOnce(reply({ error: { code: "CSRF_INVALID" } }, 403))
      .mockResolvedValueOnce(reply({ csrf_token: "fresh" }));
    vi.stubGlobal("fetch", fetcher);
    await expect(api.mutate("/students/me", "PATCH", {})).rejects.toMatchObject({
      code: "CSRF_INVALID",
    });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(await csrfToken()).toBe("fresh");
  });
  it("expires the session for private 401s but preserves the invalid-login error", async () => {
    const expired = vi.fn();
    setUnauthorizedHandler(expired);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(reply({ error: { code: "AUTH_REQUIRED" } }, 401)),
    );
    await expect(api.get("/students/me")).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledTimes(1);
  });
  it("handles network failure and unknown server errors in Arabic", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(api.get("/majors")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
    expect(errorMessage(new ApiError("NETWORK_ERROR", 0))).toContain("الاتصال");
    expect(errorMessage(new ApiError("secret diagnostic", 500))).not.toContain("secret");
  });
});
