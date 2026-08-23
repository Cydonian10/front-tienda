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

export interface CreateProduct {
  stock: number;
  price: number;
  baseProductId: number;
  productAttributes: ProductAttributeItem[];
}

export interface Product {
  id: number;
  stock: number;
  price: number;
  baseProductId: number;
  baseProductName: string;
  productAttributes: ProductAttribute[];
}

export interface ProductFilter extends PaginationQuery {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minStock?: number;
}
