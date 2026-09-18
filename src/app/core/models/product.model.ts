import { PaginationQuery } from './pagination.model';

export interface ProductAttribute {
  attributeId: number;
  attributeName: string;
  attributeValueId: number;
  attributeValue: string;
  order: number;
}

export interface ProductAttributeItem {
  attributeId: number;
  attributeValueId: number;
  order: number;
}

export interface ProductUnit {
  unitId: number;
  unitName: string;
  unitValue: string;
  factor: number;
  isMain: boolean;
}

export interface CreateProduct {
  stock: number;
  lowStockThreshold?: number | null;
  price: number;
  baseProductId: number;
  productAttributes: ProductAttributeItem[];
}

export interface UpdateProduct {
  stock?: number;
  lowStockThreshold?: number | null;
  price?: number;
  productAttributes?: ProductAttributeItem[];
}

export interface Product {
  id: number;
  stock: number;
  lowStockThreshold: number | null;
  price: number;
  baseProductId: number;
  baseProductName: string;
  productAttributes: ProductAttribute[];
  stockLabel: string | null;
  units: ProductUnit[];
}

export interface ProductFilter extends PaginationQuery {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
}
