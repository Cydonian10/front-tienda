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

export interface VarianteResponse {
  id: string;
  productoId: string;
  sku: string;
  precio: string;
  codigoBarras: string | null;
  activo: boolean;
  valores: ValorVariante[];
  imagenes: { id: string; imagenId: string; orden: number; esPrincipal: boolean }[];
}
