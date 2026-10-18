import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../api/inventario/existencia-api';
import type { FiltroExistencias } from '../../api/interfaces/inventario/existencia.interface';

export const existenciasAlmacenesQueryKey = ['existencias', 'almacenes'] as const;
export const existenciasListadoQueryKey = ['existencias', 'listado'] as const;

export const existenciasQueryKey = (filtro: FiltroExistencias | null) =>
  [
    ...existenciasListadoQueryKey,
    filtro?.almacenId ?? null,
    filtro?.page ?? null,
    filtro?.limit ?? null,
    filtro?.q ?? null,
    filtro?.productoId ?? null,
    filtro?.disponibilidad ?? null,
  ] as const;

export function useAlmacenesExistencias() {
  const api = inject(ExistenciaApi);

  return injectQuery(() => ({
    queryKey: existenciasAlmacenesQueryKey,
    queryFn: () => api.listarAlmacenes(),
    retry: false,
  }));
}

export function useExistencias(filtro: () => FiltroExistencias | null) {
  const api = inject(ExistenciaApi);

  return injectQuery(() => {
    const filtroActual = filtro();

    return {
      queryKey: existenciasQueryKey(filtroActual),
      queryFn: () => {
        if (!filtroActual) {
          throw new Error('Selecciona un almacén antes de consultar existencias.');
        }
        return api.listar(filtroActual);
      },
      enabled: filtroActual !== null && filtroActual.almacenId.length > 0,
      retry: false,
    };
  });
}
