import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { ProductoApi } from '../../api/inventario/product-api';
import { UnidadProductoApi } from '../../api/inventario/unidad-producto-api';
import type {
  AgregarUnidadProductoDto,
  EditarUnidadProductoDto,
  UnidadProductoResponse,
} from '../../api/interfaces/inventario/unidad-producto.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const catalogoUnidadesQueryKey = ['unidades', 'catalogo'] as const;
export const productoUnidadesQueryKey = (productId: string) =>
  ['productos', productId, 'unidades'] as const;

export function useProductoUnidadesApi(productId: () => string) {
  const catalogo = inject(ProductoApi);
  const api = inject(UnidadProductoApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);

  const catalogQuery = injectQuery(() => ({
    queryKey: catalogoUnidadesQueryKey,
    queryFn: () => catalogo.listUnidades(),
    staleTime: 30_000,
    retry: false,
  }));
  const assignmentsQuery = injectQuery(() => ({
    queryKey: productoUnidadesQueryKey(productId()),
    queryFn: () => api.list(productId()),
    enabled: !!productId(),
    staleTime: 30_000,
    retry: false,
  }));

  const createMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: AgregarUnidadProductoDto }) => api.create(id, dto),
    onSuccess: async (assignment, { id }) => {
      client.setQueryData<UnidadProductoResponse[]>(productoUnidadesQueryKey(id), (items) =>
        items ? [...items, assignment] : [assignment],
      );
      await client.invalidateQueries({ queryKey: productoUnidadesQueryKey(id) });
      toast.success('Unidad secundaria agregada.');
    },
  }));
  const updateMutation = injectMutation(() => ({
    mutationFn: ({
      id,
      assignmentId,
      dto,
    }: {
      id: string;
      assignmentId: string;
      dto: EditarUnidadProductoDto;
    }) => api.update(id, assignmentId, dto),
    onSuccess: async (assignment, { id }) => {
      client.setQueryData<UnidadProductoResponse[]>(productoUnidadesQueryKey(id), (items) =>
        items?.map((item) => (item.id === assignment.id ? assignment : item)),
      );
      await client.invalidateQueries({ queryKey: productoUnidadesQueryKey(id) });
      toast.success('Conversión actualizada.');
    },
  }));
  const removeMutation = injectMutation(() => ({
    mutationFn: ({ id, assignmentId }: { id: string; assignmentId: string }) =>
      api.remove(id, assignmentId),
    onSuccess: async (_, { id, assignmentId }) => {
      client.setQueryData<UnidadProductoResponse[]>(productoUnidadesQueryKey(id), (items) =>
        items?.filter((item) => item.id !== assignmentId),
      );
      await client.invalidateQueries({ queryKey: productoUnidadesQueryKey(id) });
      toast.success('Unidad secundaria eliminada.');
    },
  }));

  return { catalogQuery, assignmentsQuery, createMutation, updateMutation, removeMutation };
}
