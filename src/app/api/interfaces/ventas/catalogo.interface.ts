export interface VarianteCatalogo {
  id: string;
  productoId: string;
  nombre: string;
  sku: string;
  precio: string;
  stock: string;
  atributos: { nombre: string; valor: string }[];
  unidadBase: { id: string; nombre: string; simbolo: string };
  unidades: UnidadVenta[];
}

export interface UnidadVenta {
  id: string;
  nombre: string;
  simbolo: string;
  factorABase: string;
}

export interface CatalogoPagina {
  items: VarianteCatalogo[];
  page: number;
  limit: number;
  totalItems: number;
}

export interface FiltrosCatalogo {
  almacenId: string;
  q: string;
  page: number;
  limit: number;
}
