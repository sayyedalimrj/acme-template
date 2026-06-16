/**
 * Small helpers shared by the mock adapters.
 *
 * `delay` simulates network latency so loading states are exercised. `clone` returns a deep
 * copy so callers can never mutate the shared in-memory fixtures.
 */
export function delay(ms = 250): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Apply page/pageSize to an array, returning a 1-based page slice and total. */
export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 20,
): { items: T[]; total: number; page: number; pageSize: number } {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  return {
    items: items.slice(start, start + safeSize),
    total: items.length,
    page: safePage,
    pageSize: safeSize,
  };
}
