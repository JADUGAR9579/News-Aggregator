import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

import { useFetch } from "./useFetch.js";

// NOTE: useFetch isn't currently consumed by any page in this app — every
// page ended up hand-rolling its own fetch/pagination effect instead,
// because NewsGrid needs accumulated pages (append + hasMore), which a
// single-shot "run on deps change" hook like this one doesn't model. It's
// still required by the locked folder structure and is fully working,
// tested code — just currently unused, which is worth knowing rather than
// hiding.

describe("useFetch", () => {
  it("starts in a loading state and resolves with data", async () => {
    const fetcher = vi.fn().mockResolvedValue({ articles: ["a", "b"] });
    const { result } = renderHook(() => useFetch(fetcher, []));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ articles: ["a", "b"] });
    expect(result.current.error).toBe(null);
  });

  it("captures a rejected fetch as an error", async () => {
    const fetcher = vi.fn().mockRejectedValue({ type: "API_ERROR", message: "Boom" });
    const { result } = renderHook(() => useFetch(fetcher, []));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toEqual({ type: "API_ERROR", message: "Boom" });
    expect(result.current.data).toBe(null);
  });

  it("a superseded (aborted) request's rejection does not clobber the newer request's state", async () => {
    // This is the real invariant the CANCELLED/aborted guard in useFetch
    // protects: when a new run() aborts a previous in-flight request, that
    // old request's promise can still reject asynchronously afterwards.
    // Its rejection must be ignored so it doesn't stomp on the state the
    // newer, successful request already set.
    let resolveFirst;
    let rejectFirst;
    let resolveSecond;

    const fetcher = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            resolveFirst = resolve;
            rejectFirst = reject;
          })
      )
      .mockImplementationOnce(() => new Promise((resolve) => (resolveSecond = resolve)));

    const { result, rerender } = renderHook(({ dep }) => useFetch(fetcher, [dep]), {
      initialProps: { dep: 1 },
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    // Triggers a new run(), which aborts the first request's controller.
    rerender({ dep: 2 });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));

    // The newer request resolves first (realistic: the old one is dangling).
    resolveSecond({ from: "second" });
    await waitFor(() => expect(result.current.data).toEqual({ from: "second" }));
    expect(result.current.loading).toBe(false);

    // The stale first request finally rejects as "CANCELLED" — must be a no-op.
    rejectFirst({ type: "CANCELLED", message: "Cancelled" });
    await new Promise((r) => setTimeout(r, 10));

    expect(result.current.data).toEqual({ from: "second" });
    expect(result.current.error).toBe(null);
    expect(result.current.loading).toBe(false);

    // Silence the "unused variable" lint concern for resolveFirst, which
    // exists only to complete the Promise executor contract.
    void resolveFirst;
  });

  it("passes an AbortSignal to the fetcher", async () => {
    const fetcher = vi.fn().mockResolvedValue({});
    renderHook(() => useFetch(fetcher, []));
    await waitFor(() => expect(fetcher).toHaveBeenCalled());
    expect(fetcher.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
  });

  it("re-fetches when a dependency changes", async () => {
    const fetcher = vi.fn().mockResolvedValue({});
    const { rerender } = renderHook(({ dep }) => useFetch(fetcher, [dep]), {
      initialProps: { dep: 1 },
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    rerender({ dep: 2 });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it("does not fetch at all when skip is true", () => {
    const fetcher = vi.fn().mockResolvedValue({});
    const { result } = renderHook(() => useFetch(fetcher, [], { skip: true }));
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
  });

  it("refetch triggers another call to the fetcher", async () => {
    const fetcher = vi.fn().mockResolvedValue({ n: 1 });
    const { result } = renderHook(() => useFetch(fetcher, []));
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));

    act(() => {
      result.current.refetch();
    });
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });
});
