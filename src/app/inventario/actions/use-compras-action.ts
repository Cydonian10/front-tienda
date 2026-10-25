import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { CompraApi } from '../../api/inventario/compra-api';
import { AlmacenApi } from '../../api/inventario/almacen-api';
import { ProveedorApi } from '../../api/inventario/proveedor-api';
import { VarianteCompraApi } from '../../api/inventario/variante-compra-api';
import type { NuevaCompra } from '../../api/interfaces/inventario/compra.interface';
import { proveedoresListadoQueryKey } from './use-proveedores-action';

export const comprasListadoKey = ['compras', 'listado'] as const;
export const comprasListadoQueryKey = (page: number, limit: number, q: string) =>
  [...comprasListadoKey, page, limit, q] as const;
export const compraDetalleQueryKey = (id: string) => ['compras', 'detalle', id] as const;
export const proveedoresQueryKey = proveedoresListadoQueryKey;
export const variantesCompraQueryKey = (page: number, limit: number, q: string) =>
  ['variantes', 'compra', page, limit, q] as const;
export const almacenesCompraQueryKey = (page: number) =>
  ['almacenes', 'listado', page, 100, '', true] as const;

export function useComprasListado(page: () => number, limit: () => number, q: () => string) {
  const api = inject(CompraApi);
  return injectQuery(() => {
    const [currentPage, currentLimit, search] = [page(), limit(), q()];
    return {
      queryKey: comprasListadoQueryKey(currentPage, currentLimit, search),
      queryFn: () => api.list(currentPage, currentLimit, search || undefined),
      retry: false,
    };
  });
}

export function useCompraDetalle(id: () => string) {
  const api = inject(CompraApi);
  return injectQuery(() => {
    const compraId = id();
    return {
      queryKey: compraDetalleQueryKey(compraId),
      queryFn: () => api.getById(compraId),
      enabled: !!compraId,
      retry: false,
    };
  });
}

export function useProveedoresCompra(
  page: () => number,
  limit: () => number,
  nombre: () => string,
  documento: () => string,
) {
  const api = inject(ProveedorApi);
  return injectQuery(() => {
    const [currentPage, currentLimit, searchName, searchDocument] = [
      page(),
      limit(),
      nombre(),
      documento(),
    ];
    return {
      queryKey: proveedoresQueryKey(currentPage, currentLimit, searchName, searchDocument),
      queryFn: () =>
        api.list(currentPage, currentLimit, searchName || undefined, searchDocument || undefined),
      retry: false,
    };
  });
}

export function useVariantesCompra(page: () => number, limit: () => number, q: () => string) {
  const api = inject(VarianteCompraApi);
  return injectQuery(() => {
    const [currentPage, currentLimit, search] = [page(), limit(), q()];
    return {
      queryKey: variantesCompraQueryKey(currentPage, currentLimit, search),
      queryFn: () => api.list(currentPage, currentLimit, search || undefined),
      retry: false,
    };
  });
}

export function useAlmacenesCompra(page: () => number) {
  const api = inject(AlmacenApi);
  return injectQuery(() => {
    const currentPage = page();
    return {
      queryKey: almacenesCompraQueryKey(currentPage),
      queryFn: () => api.list(currentPage, 100, '', true),
      retry: false,
    };
  });
}

export function useConfirmarCompra() {
  const api = inject(CompraApi);
  const client = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: (compra: NuevaCompra) => api.create(compra),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: comprasListadoKey });
    },
  }));
}

export function useAdjuntarComprobante() {
  const api = inject(CompraApi);
  const client = inject(QueryClient);
  return injectMutation(() => ({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.attachComprobante(id, file),
    onSuccess: async (_, { id }) => {
      await client.invalidateQueries({ queryKey: compraDetalleQueryKey(id) });
    },
  }));
}
