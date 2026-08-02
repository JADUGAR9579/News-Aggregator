import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useFetch
 * Generic async-data hook that:
 *  - Runs `fetcher(signal)` whenever `deps` change
 *  - Cancels the previous in-flight request via AbortController
 *  - Exposes { data, loading, error, refetch }
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {Array} deps - dependency array; a new fetch runs when these change
 * @param {{ skip?: boolean }} options - skip: don't fetch (e.g. empty query)
 */
export function useFetch(fetcher, deps = [], options = {}) {
  const { skip = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const controllerRef = useRef(null);

  const run = useCallback(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    fetcher(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err?.type === "CANCELLED" || controller.signal.aborted) return;
        setError(err);
        setLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cleanup = run();
    return cleanup;
  }, [run]);

  return { data, loading, error, refetch: run };
}
