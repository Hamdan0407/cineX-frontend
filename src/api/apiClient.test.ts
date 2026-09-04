import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { api, clearApiAuth, configureApiAuth, getApiBaseUrl } from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    configureApiAuth({
      getToken: async () => "test-clerk-jwt",
    });
  });

  it("attaches Bearer token for authenticated requests", async () => {
    const adapter = vi.fn(async (config) => ({ data: {}, status: 200, statusText: "OK", headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.get("/api/bookings");
    expect(adapter).toHaveBeenCalled();
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe("Bearer test-clerk-jwt");
  });

  it("skips Authorization header when skipAuth is true", async () => {
    const adapter = vi.fn(async (config) => ({ data: [], status: 200, statusText: "OK", headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.get("/api/movies", { skipAuth: true });
    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it("does not attach Authorization when Clerk token is unavailable", async () => {
    configureApiAuth({ getToken: async () => null });
    const adapter = vi.fn(async (config) => ({ data: [], status: 200, statusText: "OK", headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.get("/api/movies");
    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it("clears the token getter on logout or provider teardown", async () => {
    clearApiAuth();
    const adapter = vi.fn(async (config) => ({ data: [], status: 200, statusText: "OK", headers: {}, config }));
    api.defaults.adapter = adapter;
    await api.get("/api/bookings");
    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it("does not trigger onUnauthorized for skipAuth requests that return 401", async () => {
    const onUnauthorized = vi.fn();
    configureApiAuth({ getToken: async () => "test-clerk-jwt", onUnauthorized });
    const adapter = vi.fn(async (config) => Promise.reject({ isAxiosError: true, config, response: { status: 401, data: { message: "Authentication required", status: 401 } } }));
    api.defaults.adapter = adapter;
    await expect(api.get("/api/cities/search", { skipAuth: true, params: { query: "chennai" } })).rejects.toBeTruthy();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("triggers onUnauthorized for protected requests that return 401", async () => {
    const onUnauthorized = vi.fn();
    configureApiAuth({ getToken: async () => "test-clerk-jwt", onUnauthorized });
    const adapter = vi.fn(async (config) => Promise.reject({ isAxiosError: true, config, response: { status: 401, data: { message: "Authentication required", status: 401 } } }));
    api.defaults.adapter = adapter;
    await expect(api.get("/api/bookings/1")).rejects.toBeTruthy();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("surfaces backend ErrorResponse message from axios errors", () => {
    const error = { isAxiosError: true, response: { status: 403, data: { message: "Access denied", status: 403 } } };
    expect(axios.isAxiosError(error)).toBe(true);
    expect(error.response?.data?.message).toBe("Access denied");
  });
});

describe("getApiBaseUrl", () => {
  it("uses the configured local API while running locally", () => {
    expect(getApiBaseUrl("http://localhost:8081", "localhost")).toBe("http://localhost:8081");
  });

  it("uses the same-origin proxy when localhost is baked into a deployed bundle", () => {
    expect(getApiBaseUrl("http://localhost:8081", "cinextickets.in")).toBe("");
  });

  it("keeps an explicitly configured production API origin", () => {
    expect(getApiBaseUrl("https://api.cinextickets.in", "cinextickets.in")).toBe("https://api.cinextickets.in");
  });
});
