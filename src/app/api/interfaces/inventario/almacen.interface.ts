export interface Almacen {
  id: string;
  nombre: string;
  activo: boolean;
}

export type CreateAlmacenDto = Pick<Almacen, 'nombre' | 'activo'>;
export type UpdateAlmacenDto = Partial<CreateAlmacenDto>;

export interface PaginatedAlmacenes {
  data: Almacen[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  totalRegistrados: number;
  totalActivos: number;
  totalInactivos: number;
}
