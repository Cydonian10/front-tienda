import { PaginationQuery } from './pagination.model';

export interface Category {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateCategory {
  name: string;
  description?: string;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
}

export interface CategoryFilter extends PaginationQuery {
  search?: string;
}
