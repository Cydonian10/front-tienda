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

export interface CreateBaseProductUnit {
  unitId: number;
  factor: number;
  isMain: boolean;
}

export interface CreateBaseProduct {
  name: string;
  units: CreateBaseProductUnit[];
  brandId?: number | null;
  categoryIds?: number[];
}

export interface CreateBaseProductResponse {
  baseProduct: BaseProduct;
  defaultProduct: unknown;
}
