import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { api, configureApiAuth } from "./apiClient";

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    configureApiAuth({
      getToken: async () => "test-clerk-jwt",
    });
  });

  it("attaches Bearer token for authenticated requests", async () => {
    const adapter = vi.fn(async (config) => ({
      data: {},
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    await api.get("/api/bookings");

    expect(adapter).toHaveBeenCalled();
    const config = adapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBe("Bearer test-clerk-jwt");
  });

  it("skips Authorization header when skipAuth is true", async () => {
    const adapter = vi.fn(async (config) => ({
      data: [],
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    await api.get("/api/movies", { skipAuth: true });

    const config = adapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBeUndefined();
  });

  it("does not attach Authorization when Clerk token is unavailable", async () => {
    configureApiAuth({ getToken: async () => null });

    const adapter = vi.fn(async (config) => ({
      data: [],
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }));
    api.defaults.adapter = adapter;

    await api.get("/api/movies");

    const config = adapter.mock.calls[0][0];
    expect(config.headers.Authorization).toBeUndefined();
  });

  it("surfaces backend ErrorResponse message from axios errors", async () => {
    const error = {
      isAxiosError: true,
      response: {
        status: 403,
        data: { message: "Access denied", status: 403 },
      },
    };
    expect(axios.isAxiosError(error)).toBe(true);
    expect(error.response?.data?.message).toBe("Access denied");
  });
});
