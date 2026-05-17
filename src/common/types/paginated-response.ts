export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export function paginated<T>(data: T[], total: number): PaginatedResponse<T> {
  return { data, total };
}
