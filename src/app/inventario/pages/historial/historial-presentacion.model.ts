import type { TipoMovimientoHistorial } from '../../../api/interfaces/inventario/historial-movimiento.interface';

export type FiltroTipoHistorial = TipoMovimientoHistorial | 'todos';

const ETIQUETAS_TIPO: Record<TipoMovimientoHistorial, string> = {
  ingreso: 'Ingreso',
  salida: 'Salida',
  traslado: 'Traslado',
  ajuste: 'Ajuste',
};

export function etiquetaTipoHistorial(tipo: TipoMovimientoHistorial): string {
  return ETIQUETAS_TIPO[tipo];
}
