import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * axios.js builds its interceptor logic around whatever axios.create()
 * returns, so mocking the axios package itself (rather than trying to spin
 * up real HTTP traffic) lets us capture the interceptor functions axios.js
 * registers and invoke them directly — a clean way to unit test retry/
 * error-normalization logic without a real network layer or an extra
 * mocking dependency outside the locked tech stack.
 */
const requestUse = vi.fn();
const responseUse = vi.fn();
const mockInstance = Object.assign(vi.fn(), {
  get: vi.fn(),
  interceptors: {
    request: { use: requestUse },
    response: { use: responseUse },
  },
});
const isCancel = vi.fn(() => false);

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockInstance),
    isCancel: (...args) => isCancel(...args),
  },
}));

describe("axios service", () => {
  let requestInterceptor;
  let responseSuccessInterceptor;
  let responseErrorInterceptor;

  beforeEach(async () => {
    vi.resetModules();
    isCancel.mockReturnValue(false);
    mockInstance.mockReset();
    mockInstance.get.mockReset();
    requestUse.mockClear();
    responseUse.mockClear();

    await import("./axios.js");
    requestInterceptor = requestUse.mock.calls[0][0];
    [responseSuccessInterceptor, responseErrorInterceptor] = responseUse.mock.calls[0];
  });

  it("passes a successful response through unchanged", () => {
    const response = { data: { ok: true } };
    expect(responseSuccessInterceptor(response)).toBe(response);
  });

  it("injects the API key as a query param on every request", () => {
    const config = requestInterceptor({ params: { country: "us" } });
    expect(config.params).toMatchObject({ country: "us" });
    expect(config.params).toHaveProperty("apikey");
  });

  it("normalizes a response-less error into NETWORK_ERROR", async () => {
    mockInstance.get.mockImplementation(() => {}); // not called in this path
    await expect(responseErrorInterceptor({ config: { __retryCount: 99 } })).rejects.toEqual({
      type: "NETWORK_ERROR",
      message: "Unable to reach the server. Check your internet connection.",
    });
  });

  it("normalizes a 4xx error into API_ERROR with the status attached", async () => {
    const error = {
      config: { __retryCount: 99 },
      response: { status: 404, data: { message: "Not found" } },
    };
    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      type: "API_ERROR",
      message: "Not found",
      status: 404,
    });
  });

  it("normalizes a 429 into RATE_LIMITED", async () => {
    const error = { config: { __retryCount: 99 }, response: { status: 429 } };
    await expect(responseErrorInterceptor(error)).rejects.toMatchObject({ type: "RATE_LIMITED" });
  });

  it("normalizes an ECONNABORTED error into TIMEOUT", async () => {
    const error = { config: { __retryCount: 99 }, code: "ECONNABORTED", response: { status: 500 } };
    // 500 would normally retry, but __retryCount is already past the max, so it should
    // fall through to normalization -- and ECONNABORTED takes precedence there.
    await expect(responseErrorInterceptor(error)).rejects.toMatchObject({ type: "TIMEOUT" });
  });

  it("normalizes a cancelled request into CANCELLED, bypassing retry", async () => {
    isCancel.mockReturnValue(true);
    const error = { config: {} };
    await expect(responseErrorInterceptor(error)).rejects.toEqual({
      type: "CANCELLED",
      message: "Request was cancelled.",
    });
  });

  it("retries a network error (no response) up to MAX_RETRY_ATTEMPTS, then gives up", async () => {
    mockInstance.mockResolvedValue({ data: "ok-after-retry" });
    const error = { config: { __retryCount: 0 } };

    // Directly exercises the retry branch: config.__retryCount starts below
    // the max, so this should call api(config) again rather than reject.
    const result = await responseErrorInterceptor(error);
    expect(result).toEqual({ data: "ok-after-retry" });
    expect(error.config.__retryCount).toBe(1);
  });

  it("does not retry a 4xx client error even on the first attempt", async () => {
    const error = { config: { __retryCount: 0 }, response: { status: 400 } };
    await expect(responseErrorInterceptor(error)).rejects.toMatchObject({ type: "API_ERROR" });
    expect(mockInstance).not.toHaveBeenCalled();
  });
});
