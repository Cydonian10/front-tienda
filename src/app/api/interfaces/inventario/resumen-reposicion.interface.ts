/** Los saldos y mínimos decimales llegan como cadenas exactas desde la API. */
export interface AlertaReposicion {
  varianteId: string;
  productoNombre: string;
  sku: string;
  almacenId: string;
  almacenNombre: string;
  unidadBaseSimbolo: string;
  cantidadBase: string;
  minimoBase: string | null;
  tipo: 'agotada' | 'bajo_minimo';
}

export interface ResumenReposicion {
  bajoMinimo: number;
  agotadas: number;
  /** Hasta diez alertas. */
  alertas: AlertaReposicion[];
}

export interface ConteoDiarioInventario {
  fecha: string;
  cantidad: number;
}

export interface PeriodoActividadInventario {
  desde: string;
  hasta: string;
}

export interface CompraRecienteInventario {
  id: string;
  fecha: string;
  proveedorNombre: string;
  tipoDocumento: string | null;
  serieDocumento: string | null;
  numeroDocumento: string | null;
  totalDocumento: string | null;
  recibida: boolean;
}

export interface ResumenComprasInventario {
  total: number;
  porDia: ConteoDiarioInventario[];
  /** Hasta cinco compras. */
  recientes: CompraRecienteInventario[];
}

export interface SalidaRecienteInventario {
  id: string;
  fecha: string;
  almacenOrigenId: string;
  almacenOrigenNombre: string;
  cantidadDetalles: number;
}

export interface ResumenSalidasInventario {
  total: number;
  porDia: ConteoDiarioInventario[];
  /** Hasta cinco salidas. */
  recientes: SalidaRecienteInventario[];
}
