import type { ProductImage } from './producto.interface';

export interface ValorVariante {
  atributoId: string;
  valor: string;
}

export interface CreateVarianteDto {
  sku?: string;
  precio: string;
  codigoBarras?: string;
  valores: ValorVariante[];
  imagenes: File[];
}

export interface UpdateVarianteDto {
  precio?: string;
  codigoBarras?: string | null;
  activo?: boolean;
  imagenesConservarIds?: string[];
  imagenes?: File[];
}

export interface VarianteImagenEfectiva extends ProductImage {
  origen: 'producto' | 'variante';
}

export interface VarianteResponse {
  id: string;
  productoId: string;
  sku: string;
  precio: string;
  codigoBarras: string | null;
  activo: boolean;
  valores: ValorVariante[];
  imagenes: ProductImage[];
}
