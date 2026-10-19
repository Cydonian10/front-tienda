import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { ToastService } from '../../shared/services/toast/toast.service';
import { ProductoApi } from '../../api/inventario/product-api';
import type {
  CreateProductDto,
  ProductResponse,
  UpdateProductDto,
} from '../../api/interfaces/inventario/producto.interface';

export const productosBusquedaKey = ['productos', 'busqueda'] as const;
export const productosBusquedaQueryKey = (q: string, page: number, limit: number) =>
  [...productosBusquedaKey, q, page, limit] as const;
export const productoDetalleQueryKey = (id: string) => ['productos', id, 'detalle'] as const;
export const productoImagenesKey = (id: string) => ['productos', id, 'imagenes'] as const;
export const productoImagenQueryKey = (id: string, imageId: string) =>
  [...productoImagenesKey(id), imageId, 'archivo'] as const;

export function useProductosBusqueda(q: () => string, page: () => number, limit: () => number) {
  const api = inject(ProductoApi);
  return injectQuery(() => {
    const [term, currentPage, pageSize] = [q().trim(), page(), limit()];
    return {
      queryKey: productosBusquedaQueryKey(term, currentPage, pageSize),
      queryFn: () => api.search({ q: term, page: currentPage, limit: pageSize }),
      enabled: term.length >= 2,
      retry: false,
    };
  });
}

export function useProductoDetalle(id: () => string) {
  const api = inject(ProductoApi);
  return injectQuery(() => {
    const productId = id();
    return {
      queryKey: productoDetalleQueryKey(productId),
      queryFn: () => api.getById(productId),
      enabled: !!productId,
      retry: false,
    };
  });
}

export function useProductoImagen(id: () => string, imageId: () => string) {
  const api = inject(ProductoApi);
  return injectQuery(() => {
    const [productId, fileId] = [id(), imageId()];
    return {
      queryKey: productoImagenQueryKey(productId, fileId),
      queryFn: () => api.getImage(productId, fileId),
      enabled: !!productId && !!fileId,
      retry: false,
    };
  });
}

export function useProductoApi() {
  const apiProducto = inject(ProductoApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);

  const crearMutation = injectMutation(() => ({
    mutationFn: (dto: CreateProductDto) => apiProducto.create(dto),
    onSuccess: async (product) => {
      client.setQueryData<ProductResponse>(productoDetalleQueryKey(product.id), product);
      await client.invalidateQueries({ queryKey: productosBusquedaKey });
      toast.success('Producto creado correctamente.');
    },
  }));

  const actualizarMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateProductDto }) => apiProducto.update(id, dto),
    onSuccess: async (product, { id, dto }) => {
      client.setQueryData<ProductResponse>(productoDetalleQueryKey(id), product);
      await Promise.all([
        client.invalidateQueries({ queryKey: productoDetalleQueryKey(id) }),
        client.invalidateQueries({ queryKey: productosBusquedaKey }),
        ...(dto.imagenesConservarIds !== undefined || dto.imagenes?.length
          ? [
              client.invalidateQueries({ queryKey: productoImagenesKey(id) }),
              client.invalidateQueries({ queryKey: ['productos', id, 'galerias-variante'] }),
            ]
          : []),
      ]);
      toast.success('Producto actualizado correctamente.');
    },
  }));

  return {
    crearMutation,
    actualizarMutation,
  };
}
