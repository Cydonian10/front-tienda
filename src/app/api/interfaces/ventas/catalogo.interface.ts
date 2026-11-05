export interface ProductoCatalogo {
  id: string;
  nombre: string;
  precioDesde: string;
  variantes: number;
  stock: string;
}

export interface CatalogoPagina {
  items: ProductoCatalogo[];
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
