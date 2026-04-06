/**
 * Creates a fetch wrapper that cancels the previous in-flight request before
 * starting a new one. Prevents stale out-of-order responses from overwriting
 * newer data (e.g. rapid date-chevron clicks in the dashboard).
 *
 * Usage:
 *   const fetcher = useRef(createSequentialFetcher())
 *   const res = await fetcher.current('/api/meals?date=...')
 *   // AbortError is thrown if superseded — callers should handle it
 */
export function createSequentialFetcher() {
  let controller: AbortController | null = null

  return function sequentialFetch(url: string, options?: Omit<RequestInit, 'signal'>): Promise<Response> {
    controller?.abort()
    controller = new AbortController()
    return globalThis.fetch(url, { ...options, signal: controller.signal })
  }
}
