export type TipoMovimientoHistorial = 'ingreso' | 'salida' | 'traslado' | 'ajuste';

export interface FiltroHistorialMovimientos {
  q?: string;
  tipo?: TipoMovimientoHistorial;
  desde?: string;
  hasta?: string;
  page: number;
  limit: number;
}

export interface HistorialMovimientoResumen {
  id: string;
  fecha: string;
  tipo: TipoMovimientoHistorial;
  estado: 'confirmado';
  almacenOrigen: string | null;
  almacenDestino: string | null;
  cantidadDetalles: number;
  valorCosto: string | null;
}

export interface HistorialMovimientosPagina {
  data: HistorialMovimientoResumen[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HistorialMovimientoLinea {
  id: string;
  producto: string;
  sku: string;
  cantidad: string;
  unidad: string;
  factorABase: string;
  cantidadBase: string;
  costoTotal: string | null;
  costoAplicado: string | null;
}

export interface HistorialMovimientoDetalle extends HistorialMovimientoResumen {
  usuario: string;
  compraId: string | null;
  motivo: string | null;
  detalles: HistorialMovimientoLinea[];
}
