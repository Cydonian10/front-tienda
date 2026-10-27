import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CompraApi } from '../../api/inventario/compra-api';
import { ExistenciaApi } from '../../api/inventario/existencia-api';
import { MovimientoApi } from '../../api/inventario/movimiento-api';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type { PeriodoActividadInventario } from '../../api/interfaces/inventario/resumen-reposicion.interface';
import { usePermissions } from '../../auth/services/use-permissions';

export const resumenReposicionKey = ['existencias', 'resumen-reposicion'] as const;
export const resumenReposicionQueryKey = (almacenId: string | null) =>
  [...resumenReposicionKey, almacenId] as const;
export const resumenComprasKey = ['compras', 'resumen-inventario'] as const;
export const resumenComprasQueryKey = (periodo: PeriodoActividadInventario | null) =>
  [...resumenComprasKey, periodo?.desde ?? null, periodo?.hasta ?? null] as const;
export const resumenSalidasKey = ['movimientos', 'resumen-salidas'] as const;
export const resumenSalidasQueryKey = (almacenId: string | null, periodo: PeriodoActividadInventario | null) =>
  [...resumenSalidasKey, almacenId, periodo?.desde ?? null, periodo?.hasta ?? null] as const;

export function useResumenReposicion(almacenId: () => string | null) {
  const api = inject(ExistenciaApi);
  const permissions = usePermissions('INVENTARIO', { read: PERMISSION_CODES.EXISTENCIAS_READ });
  return injectQuery(() => {
    const id = almacenId();
    return {
      queryKey: resumenReposicionQueryKey(id),
      queryFn: () => {
        if (!id) throw new Error('Selecciona un almacén.');
        return api.resumenReposicion(id);
      },
      enabled: permissions.read() && !!id,
      retry: false,
    };
  });
}

export function useResumenCompras(periodo: () => PeriodoActividadInventario | null) {
  const api = inject(CompraApi);
  const permissions = usePermissions('INVENTARIO', { read: PERMISSION_CODES.COMPRAS_READ });
  return injectQuery(() => {
    const rango = periodo();
    return {
      queryKey: resumenComprasQueryKey(rango),
      queryFn: () => {
        if (!rango) throw new Error('Selecciona un rango de fechas válido.');
        return api.resumenInventario(rango);
      },
      enabled: permissions.read() && !!rango,
      retry: false,
    };
  });
}

export function useResumenSalidas(almacenId: () => string | null, periodo: () => PeriodoActividadInventario | null) {
  const api = inject(MovimientoApi);
  const permissions = usePermissions('INVENTARIO', { read: PERMISSION_CODES.MOVIMIENTOS_READ });
  return injectQuery(() => {
    const id = almacenId();
    const rango = periodo();
    return {
      queryKey: resumenSalidasQueryKey(id, rango),
      queryFn: () => {
        if (!id || !rango) throw new Error('Selecciona un almacén y un rango válido.');
        return api.resumenSalidas(id, rango);
      },
      enabled: permissions.read() && !!id && !!rango,
      retry: false,
    };
  });
}
