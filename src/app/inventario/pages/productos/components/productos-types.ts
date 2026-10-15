export interface ProductStep {
  title: string;
  detail: string;
}

export interface ProductVariant {
  sku: string;
  color: string;
  size: string;
  price: string;
  barcode: string;
}

export type ProductMode = 'create' | 'manage';
