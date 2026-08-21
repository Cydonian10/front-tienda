import { PaginationQuery } from './pagination.model';

export interface BaseProduct {
  id: number;
  name: string;
  productCount: number;
  unitCount: number;
  brand: { id: number; name: string } | null;
  categories: { id: number; name: string }[];
}

export interface BaseProductDetail extends Omit<BaseProduct, 'unitCount'> {
  units: BaseProductUnit[];
}

export interface BaseProductUnit {
  id: number;
  name: string;
  value: string;
  factor: number;
  isMain: boolean;
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
  initialStock: number;
  initialPrice: number;
}

export interface DefaultProduct {
  id: number;
  name: string;
  stock: number;
  price: number;
  baseProductId: number;
  baseProductName: string;
  productAttributes: {
    attributeId: number;
    attributeName: string;
    attributeValueId: number;
    attributeValue: string;
  }[];
  stockLabel: string | null;
  units: {
    unitId: number;
    unitName: string;
    unitValue: string;
    isMain: boolean;
    factor: number;
  }[];
}

export interface CreateBaseProductResponse {
  baseProduct: BaseProduct;
  defaultProduct: DefaultProduct;
}

export interface UpdateBaseProduct {
  name?: string;
  brandId?: number | null;
  categoryIds?: number[];
  units?: CreateBaseProductUnit[];
}
