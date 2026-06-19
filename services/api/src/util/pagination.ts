/**
 * Pagination helpers for list endpoints (bounded to protect the DB and upstreams).
 */
export interface Pagination {
  page: number;
  pageSize: number;
  offset: number;
}

export function parsePagination(query: Record<string, unknown>, maxPageSize = 100): Pagination {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const requested = parseInt(String(query.pageSize ?? '20'), 10) || 20;
  const pageSize = Math.min(maxPageSize, Math.max(1, requested));
  return { page, pageSize, offset: (page - 1) * pageSize };
}
