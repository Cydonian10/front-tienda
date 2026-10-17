export interface Atributo {
  id: string;
  nombre: string;
}

export interface AtributoListado extends Atributo {
  usoProductos: number;
}

export interface AtributosResponse {
  data: AtributoListado[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  totalRegistrados: number;
  totalEnUso: number;
}

export interface AtributoDto {
  nombre: string;
}
