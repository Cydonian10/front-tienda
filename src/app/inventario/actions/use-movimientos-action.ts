import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { MovimientoApi } from '../../api/inventario/movimiento-api';
import type {
  FiltroVariantesMovimiento,
  NuevoMovimiento,
} from '../../api/interfaces/inventario/movimiento.interface';
import { existenciasListadoQueryKey } from './use-existencias-action';

export const movimientosAlmacenesQueryKey = ['movimientos', 'almacenes'] as const;
export const movimientosVariantesKey = ['movimientos', 'variantes'] as const;
export const movimientosVariantesQueryKey = (filtro: FiltroVariantesMovimiento | null) =>
  [
    ...movimientosVariantesKey,
    filtro?.tipo ?? null,
    filtro?.almacenId ?? null,
    filtro?.q ?? null,
    filtro?.page ?? null,
    filtro?.limit ?? null,
  ] as const;

export function useAlmacenesMovimiento() {
  const api = inject(MovimientoApi);

  return injectQuery(() => ({
    queryKey: movimientosAlmacenesQueryKey,
    queryFn: () => api.listarAlmacenes(),
    retry: false,
  }));
}

export function useVariantesMovimiento(filtro: () => FiltroVariantesMovimiento | null) {
  const api = inject(MovimientoApi);

  return injectQuery(() => {
    const actual = filtro();
    return {
      queryKey: movimientosVariantesQueryKey(actual),
      queryFn: () => {
        if (!actual) throw new Error('Selecciona un almacén para buscar variantes.');
        return api.buscarVariantes(actual);
      },
      enabled: !!actual?.almacenId && (actual?.q.trim().length ?? 0) >= 2,
      retry: false,
    };
  });
}

export function useCrearMovimiento() {
  const api = inject(MovimientoApi);
  const client = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (movimiento: NuevoMovimiento) => api.crear(movimiento),
    retry: false,
    onSuccess: async (_, movimiento) => {
      const almacenes = new Set([
        movimiento.almacenOrigenId,
        ...(movimiento.almacenDestinoId ? [movimiento.almacenDestinoId] : []),
      ]);
      await Promise.all([
        client.invalidateQueries({
          queryKey: existenciasListadoQueryKey,
          predicate: (query) =>
            query.queryKey[2] === 'todos' ||
            (typeof query.queryKey[2] === 'string' && almacenes.has(query.queryKey[2])),
        }),
        client.invalidateQueries({
          queryKey: movimientosVariantesKey,
          predicate: (query) =>
            typeof query.queryKey[3] === 'string' && almacenes.has(query.queryKey[3]),
        }),
      ]);
    },
  }));
}
