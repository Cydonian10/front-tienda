export interface CrearMovimientoCajaDto {
  turnoId: string;
  tipo: 'ingreso' | 'egreso';
  importe: string;
  motivo: string;
}

export interface MovimientoCaja {
  id: string;
  turnoId: string;
  tipo: 'ingreso' | 'egreso';
  importe: string;
  motivo: string;
  fecha: string;
  cajaId: string;
  cajaNombre: string;
  cajaCodigo: string;
  fechaOperativa: string;
  usuarioId: string;
  usuarioNombre: string;
  responsableId: string;
  responsableNombre: string;
}

export interface FiltroMovimientosCaja { desde: string; hasta: string; page: number; limit: number }
export interface PaginaMovimientosCaja { data: MovimientoCaja[]; total: number; page: number; limit: number }
