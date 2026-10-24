export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CategoriasPagina {
  items: Categoria[];
  page: number;
  limit: number;
  totalItems: number;
}

export interface CrearCategoriaDto {
  nombre: string;
  descripcion?: string | null;
}

export interface EditarCategoriaDto {
  nombre?: string;
  descripcion?: string | null;
}
