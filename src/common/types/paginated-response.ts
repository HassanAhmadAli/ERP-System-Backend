export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number | null;
  offset: number | null;
  isFinalPage?: boolean | null;
}

export function paginated<T>(
  data: T[],
  total: number,
  limit: number | null,
  offset: number | null,
): PaginatedResponse<T> {
  if (limit == null || offset == null) return { data, total, limit, offset };
  return { data, total, limit, offset, isFinalPage: offset + limit >= total };
}
