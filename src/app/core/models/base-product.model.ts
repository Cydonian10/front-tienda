import { PaginationQuery } from './pagination.model';

export interface BaseProduct {
  id: number;
  name: string;
  productCount: number;
  unitCount: number;
  brand: { id: number; name: string } | null;
  categories: { id: number; name: string }[];
}

export interface BaseProductFilter extends PaginationQuery {
  search?: string;
  brandId?: number;
  categoryId?: number;
}
