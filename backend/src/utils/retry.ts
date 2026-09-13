export async function withRetry<T>(fn: (attempt: number) => Promise<T>, maxAttempts = 3): Promise<T> {
  let last: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(attempt) } catch (err) {
      last = err
      if (attempt === maxAttempts) break
      const retryAfter = Number((err as any)?.retryAfterMs || 0)
      const wait = retryAfter > 0 ? retryAfter : 500 * 2 ** (attempt - 1)
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw last
}
