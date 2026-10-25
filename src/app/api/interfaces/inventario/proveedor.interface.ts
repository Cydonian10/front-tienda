import type { PaginationMeta, ProveedorResponse } from './compra.interface';

export interface CrearProveedorDto {
  nombre: string;
  documento?: string | null;
  contacto?: string | null;
}

export interface FiltroComprasProveedor {
  desde?: string;
  hasta?: string;
  page: number;
  limit: number;
}

export interface CompraProveedorResumen {
  id: string;
  fecha: string;
  tipoDocumento: 'factura' | 'boleta' | 'otro' | null;
  serieDocumento: string | null;
  numeroDocumento: string | null;
  totalDocumento: string | null;
}

export interface InformeComprasProveedor {
  proveedor: ProveedorResponse;
  resumen: {
    cantidadCompras: number;
    totalDocumento: string | null;
  };
  data: CompraProveedorResumen[];
  meta: PaginationMeta;
}
