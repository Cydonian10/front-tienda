export interface UnidadMedida {
  id: string;
  nombre: string;
  simbolo: string;
  tipo: string;
}

export type CreateUnidadDto = Omit<UnidadMedida, 'id'>;
export type UpdateUnidadDto = Partial<CreateUnidadDto>;

export interface PaginatedUnidades {
  data: UnidadMedida[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
