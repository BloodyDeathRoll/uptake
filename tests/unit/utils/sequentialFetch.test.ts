import { createSequentialFetcher } from '@/lib/utils/sequential-fetch'

// Build a fake Response the way globalThis.fetch returns one
function makeResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/**
 * Returns a fetch mock that:
 *  - immediately rejects with AbortError if signal is already aborted
 *  - rejects with AbortError when the signal fires mid-flight
 *  - otherwise stays pending until you call `resolve(data)` or `reject(err)`
 *
 * `onCalled` fires synchronously each time the mock is invoked so tests can
 * track call order without timing dependencies.
 */
function makeControllableFetch(onCalled?: (callIndex: number) => void) {
  let callIndex = 0
  const resolvers: Array<{ resolve: (r: Response) => void; reject: (e: Error) => void }> = []

  const mockFetch = jest.fn((_url: string, options?: RequestInit): Promise<Response> => {
    const idx = callIndex++
    onCalled?.(idx)
    const signal = options?.signal as AbortSignal | undefined

    return new Promise<Response>((resolve, reject) => {
      if (signal?.aborted) {
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
        return
      }
      resolvers[idx] = { resolve, reject }
      signal?.addEventListener('abort', () => {
        reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }))
      })
    })
  })

  return {
    mockFetch,
    resolve: (idx: number, data: unknown) => resolvers[idx]?.resolve(makeResponse(data)),
    reject: (idx: number, err?: Error) =>
      resolvers[idx]?.reject(err ?? Object.assign(new Error('Network error'), { name: 'TypeError' })),
  }
}

// ─── Basic operation ──────────────────────────────────────────────────────────

describe('createSequentialFetcher: basic operation', () => {
  test('resolves with the response when there is no prior request', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()
    const p = fetcher('/api/meals?date=2024-01-01')
    resolve(0, { meals: ['A'] })

    const res = await p
    const json = await res.json()
    expect(json).toEqual({ meals: ['A'] })
    jest.restoreAllMocks()
  })

  test('passes the URL through to globalThis.fetch', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()
    const p = fetcher('/api/meals?startDate=2024-01-01&endDate=2024-01-01')
    resolve(0, [])
    await p

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/meals?startDate=2024-01-01&endDate=2024-01-01',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
    jest.restoreAllMocks()
  })
})

// ─── Cancellation ─────────────────────────────────────────────────────────────

describe('createSequentialFetcher: cancellation', () => {
  test('second call aborts the first request with AbortError', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()

    const p1 = fetcher('/api/meals?date=2024-01-01')
    const p2 = fetcher('/api/meals?date=2024-01-02') // aborts p1
    resolve(1, { date: '2024-01-02' })

    // p1 should reject with AbortError
    await expect(p1).rejects.toMatchObject({ name: 'AbortError' })
    // p2 resolves normally
    const res = await p2
    const json = await res.json()
    expect(json).toEqual({ date: '2024-01-02' })
    jest.restoreAllMocks()
  })

  test('only the last request resolves when three are fired rapidly', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()
    const p1 = fetcher('/api/meals?date=2024-01-01')
    const p2 = fetcher('/api/meals?date=2024-01-02')
    const p3 = fetcher('/api/meals?date=2024-01-03')
    resolve(2, { date: '2024-01-03' })

    await expect(p1).rejects.toMatchObject({ name: 'AbortError' })
    await expect(p2).rejects.toMatchObject({ name: 'AbortError' })
    const res = await p3
    const json = await res.json()
    expect(json).toEqual({ date: '2024-01-03' })
    jest.restoreAllMocks()
  })
})

// ─── Race condition: out-of-order responses ────────────────────────────────────

describe('createSequentialFetcher: out-of-order responses', () => {
  test('stale response arriving after a newer request is discarded (AbortError)', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()
    const results: unknown[] = []

    // Request for date A (will resolve last — simulates slow response)
    const pA = fetcher('/api/meals?date=2024-01-01')
      .then(r => r.json()).then(d => results.push(d))
      .catch(() => { /* AbortError — intentionally ignored */ })

    // Request for date B (will resolve first — simulates fast response)
    const pB = fetcher('/api/meals?date=2024-01-02')
      .then(r => r.json()).then(d => results.push(d))

    // B resolves first
    resolve(1, { date: '2024-01-02', meals: ['lunch'] })
    await pB

    // A resolves late — but its request was already aborted
    resolve(0, { date: '2024-01-01', meals: ['breakfast'] })
    await pA

    // Only B's data should have been collected
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual({ date: '2024-01-02', meals: ['lunch'] })
    jest.restoreAllMocks()
  })

  test('sequential non-overlapping requests both succeed', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()

    // First request completes before second starts
    const p1 = fetcher('/api/meals?date=2024-01-01')
    resolve(0, { date: '2024-01-01' })
    const json1 = await p1.then(r => r.json())

    // Second request starts after first is done
    const p2 = fetcher('/api/meals?date=2024-01-02')
    resolve(1, { date: '2024-01-02' })
    const json2 = await p2.then(r => r.json())

    expect(json1).toEqual({ date: '2024-01-01' })
    expect(json2).toEqual({ date: '2024-01-02' })
    jest.restoreAllMocks()
  })

  test('spinner scenario: 5 rapid chevron clicks, UI ends up on the 5th date', async () => {
    const { mockFetch, resolve } = makeControllableFetch()
    jest.spyOn(globalThis, 'fetch').mockImplementation(mockFetch)

    const fetcher = createSequentialFetcher()
    const appliedDates: string[] = []

    const dates = ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05']
    const promises = dates.map((date, i) =>
      fetcher(`/api/meals?date=${date}`)
        .then(r => r.json())
        .then(d => appliedDates.push(d.date))
        .catch(() => { /* aborted — ignore */ })
    )

    // Only the last request (index 4) survives; resolve it
    resolve(4, { date: '2024-01-05' })
    await promises[4]
    await Promise.allSettled(promises)

    expect(appliedDates).toEqual(['2024-01-05'])
    jest.restoreAllMocks()
  })
})
