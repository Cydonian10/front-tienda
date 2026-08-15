import { PaginationQuery } from './pagination.model';

export interface Brand {
  id: number;
  name: string;
  description: string | null;
}

export interface CreateBrand {
  name: string;
  description?: string;
}

export interface UpdateBrand {
  name?: string;
  description?: string;
}

export interface BrandFilter extends PaginationQuery {
  search?: string;
}
