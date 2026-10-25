import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ProveedorApi } from '../../api/inventario/proveedor-api';
import { PERMISSION_CODES } from '../../api/interfaces/access-control/permision.interface';
import type {
  CrearProveedorDto,
  FiltroComprasProveedor,
} from '../../api/interfaces/inventario/proveedor.interface';
import { AuthorizationService } from '../../auth/services/authorization.service';
import { usePermissions } from '../../auth/services/use-permissions';

export const proveedoresListadoKey = ['proveedores', 'listado'] as const;
export const proveedoresListadoQueryKey = (
  page: number,
  limit: number,
  nombre: string,
  documento: string,
) => [...proveedoresListadoKey, page, limit, nombre, documento] as const;

export const proveedorComprasQueryKey = (id: string, filtro: FiltroComprasProveedor | null) =>
  [
    'proveedores', 'compras', id,
    filtro?.desde ?? null, filtro?.hasta ?? null,
    filtro?.page ?? null, filtro?.limit ?? null,
  ] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useProveedoresListado(
  page: () => number,
  limit: () => number,
  nombre: () => string,
  documento: () => string,
) {
  const api = inject(ProveedorApi);
  const access = usePermissions('INVENTARIO', { read: PERMISSION_CODES.PROVEEDORES_READ });
  return injectQuery(() => {
    const [currentPage, currentLimit, searchName, searchDocument] = [
      page(), limit(), nombre(), documento(),
    ];
    return {
      queryKey: proveedoresListadoQueryKey(currentPage, currentLimit, searchName, searchDocument),
      queryFn: () => api.list(
        currentPage, currentLimit, searchName || undefined, searchDocument || undefined,
      ),
      enabled: access.read(),
      retry: false,
    };
  });
}

export function useProveedorCompras(id: () => string, filtro: () => FiltroComprasProveedor | null) {
  const api = inject(ProveedorApi);
  const access = usePermissions('INVENTARIO', {
    proveedores: PERMISSION_CODES.PROVEEDORES_READ,
    compras: PERMISSION_CODES.COMPRAS_READ,
  });
  return injectQuery(() => {
    const proveedorId = id();
    const currentFilter = filtro();
    return {
      queryKey: proveedorComprasQueryKey(proveedorId, currentFilter),
      queryFn: () => {
        if (!UUID.test(proveedorId) || !currentFilter) {
          throw new Error('Selecciona un proveedor y un rango de fechas válidos.');
        }
        return api.listCompras(proveedorId, currentFilter);
      },
      enabled: UUID.test(proveedorId) && currentFilter !== null && access.proveedores() && access.compras(),
      retry: false,
    };
  });
}

export function useCrearProveedor() {
  const api = inject(ProveedorApi);
  const client = inject(QueryClient);
  const authorization = inject(AuthorizationService);
  return injectMutation(() => ({
    mutationFn: (dto: CrearProveedorDto) => {
      if (!authorization.hasPermission('INVENTARIO', PERMISSION_CODES.PROVEEDORES_CREATE)) {
        throw new Error('No tienes permiso para crear proveedores.');
      }
      return api.create(dto);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: proveedoresListadoKey });
    },
  }));
}
