import type { PaginatedResponse } from './compra.interface';

export type TipoMovimiento = 'salida' | 'traslado' | 'ajuste';

export interface AlmacenMovimiento {
  id: string;
  nombre: string;
}

export interface UnidadMovimiento {
  id: string;
  nombre: string;
  simbolo: string;
  factorABase: string;
}

export interface VarianteMovimiento {
  producto: { id: string; nombre: string; activo: boolean };
  variante: { id: string; sku: string; activo: boolean };
  cantidadBase: string;
  unidades: UnidadMovimiento[];
}

export type ListaVariantesMovimientoResponse = PaginatedResponse<VarianteMovimiento>;

export interface FiltroVariantesMovimiento {
  tipo: TipoMovimiento;
  almacenId: string;
  q: string;
  page: number;
  limit: number;
}

export interface DetalleNuevoMovimiento {
  varianteId: string;
  unidadId: string;
  cantidad: string;
  costoUnitarioBase?: string;
}

export interface NuevoMovimiento {
  idempotenciaClave: string;
  tipo: TipoMovimiento;
  almacenOrigenId: string;
  almacenDestinoId?: string;
  motivo?: string;
  detalles: DetalleNuevoMovimiento[];
}

export interface MovimientoCreado {
  id: string;
  tipo: TipoMovimiento;
  estado: 'confirmado';
}
