import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { UnidadApi } from '../../api/inventario/unidad-api';
import type {
  CreateUnidadDto,
  UpdateUnidadDto,
} from '../../api/interfaces/inventario/unidad.interface';
import { ToastService } from '../../shared/services/toast/toast.service';
import { catalogoUnidadesQueryKey } from './use-producto-unidades-action';

export const unidadesQueryKey = ['unidades', 'listado'] as const;

export function useUnidadMedida({
  page,
  limit,
  nombre,
  enabled = true,
}: {
  page: () => number;
  limit: () => number;
  nombre: () => string;
  enabled?: boolean;
}) {
  const api = inject(UnidadApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);

  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: unidadesQueryKey }),
      client.invalidateQueries({ queryKey: catalogoUnidadesQueryKey }),
    ]);
  };

  const listQuery = injectQuery(() => ({
    queryKey: [...unidadesQueryKey, page(), limit(), nombre()],
    queryFn: () => api.list(page(), limit(), nombre() || undefined),
    enabled,
    retry: false,
  }));

  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CreateUnidadDto) => api.create(dto),
    onSuccess: async () => {
      await refresh();
      toast.success('Unidad creada correctamente.');
    },
  }));

  const updateMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateUnidadDto }) => api.update(id, dto),
    onSuccess: async () => {
      await refresh();
      toast.success('Unidad actualizada correctamente.');
    },
  }));

  const removeMutation = injectMutation(() => ({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: async () => {
      await refresh();
      toast.success('Unidad eliminada correctamente.');
    },
  }));

  return { listQuery, createMutation, updateMutation, removeMutation };
}
