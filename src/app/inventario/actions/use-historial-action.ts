import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../api/inventario/movimiento-api';
import type { FiltroHistorialMovimientos } from '../../api/interfaces/inventario/historial-movimiento.interface';

export const historialListadoKey = ['movimientos', 'historial', 'listado'] as const;
export const historialListadoQueryKey = (filtro: FiltroHistorialMovimientos | null) =>
  [
    ...historialListadoKey,
    filtro?.q ?? null,
    filtro?.tipo ?? null,
    filtro?.desde ?? null,
    filtro?.hasta ?? null,
    filtro?.page ?? null,
    filtro?.limit ?? null,
  ] as const;
export const historialDetalleQueryKey = (id: string) =>
  ['movimientos', 'historial', 'detalle', id] as const;

export function useHistorialListado(filtro: () => FiltroHistorialMovimientos | null) {
  const api = inject(MovimientoApi);
  return injectQuery(() => {
    const actual = filtro();
    return {
      queryKey: historialListadoQueryKey(actual),
      queryFn: () => {
        if (!actual) throw new Error('Selecciona un rango válido para consultar el historial.');
        return api.listarHistorial(actual);
      },
      enabled: actual !== null,
      retry: false,
    };
  });
}

export function useHistorialDetalle(id: () => string) {
  const api = inject(MovimientoApi);
  return injectQuery(() => {
    const actual = id();
    return {
      queryKey: historialDetalleQueryKey(actual),
      queryFn: () => api.obtenerHistorial(actual),
      enabled: !!actual,
      retry: false,
    };
  });
}
