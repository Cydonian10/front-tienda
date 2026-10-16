import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../api/inventario/product-api';
import type { AtributoProducto } from '../../api/interfaces/inventario/producto.interface';

export const productoAtributosQueryKey = (productId: string) =>
  ['productos', productId, 'atributos'] as const;

export function useProductoAtributosApi(productId: () => string) {
  const api = inject(ProductoApi);
  const queryClient = inject(QueryClient);

  const attributesQuery = injectQuery(() => ({
    queryKey: productoAtributosQueryKey(productId()),
    queryFn: () => api.listAttributes(productId()),
    enabled: !!productId(),
    staleTime: 30_000,
    retry: false,
  }));

  const addAttributeMutation = injectMutation(() => ({
    mutationFn: ({ id, attributeId }: { id: string; attributeId: string }) =>
      api.addAttribute(id, attributeId),
    onSuccess: async (_, { id, attributeId }) => {
      queryClient.setQueryData<AtributoProducto[]>(productoAtributosQueryKey(id), (attributes) =>
        attributes?.map((attribute) =>
          attribute.atributoId === attributeId ? { ...attribute, productoId: id } : attribute,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: productoAtributosQueryKey(id) });
    },
  }));

  const removeAttributeMutation = injectMutation(() => ({
    mutationFn: ({ id, attributeId }: { id: string; attributeId: string }) =>
      api.removeAttribute(id, attributeId),
    onSuccess: async (_, { id, attributeId }) => {
      queryClient.setQueryData<AtributoProducto[]>(productoAtributosQueryKey(id), (attributes) =>
        attributes?.map((attribute) =>
          attribute.atributoId === attributeId ? { ...attribute, productoId: null } : attribute,
        ),
      );
      await queryClient.invalidateQueries({ queryKey: productoAtributosQueryKey(id) });
    },
  }));

  return { attributesQuery, addAttributeMutation, removeAttributeMutation };
}
