export interface Marca {
  id: string;
  nombre: string;
  activo: boolean;
  imagenId: string | null;
}

export interface MarcasPagina {
  items: Marca[];
  page: number;
  limit: number;
  totalItems: number;
}

export interface CrearMarcaDto {
  nombre: string;
  imagen?: File;
}

export interface EditarMarcaDto {
  nombre?: string;
  imagen?: File;
  quitarImagen?: boolean;
}
