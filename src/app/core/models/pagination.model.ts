export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}
