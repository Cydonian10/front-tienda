import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AtributoApi } from '../../api/inventario/atributo-api';
import type { AtributoDto } from '../../api/interfaces/inventario/atributo.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const atributosQueryKey = ['atributos', 'listado'] as const;

export function useAtributos({
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
  const api = inject(AtributoApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);
  const refresh = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: atributosQueryKey }),
      client.invalidateQueries({
        queryKey: ['productos'],
        predicate: (query) => query.queryKey[2] === 'atributos',
      }),
    ]);
  };

  const listQuery = injectQuery(() => ({
    queryKey: [...atributosQueryKey, page(), limit(), nombre()],
    queryFn: () => api.list(page(), limit(), nombre() || undefined),
    enabled,
    retry: false,
  }));
  const createMutation = injectMutation(() => ({
    mutationFn: (dto: AtributoDto) => api.create(dto),
    onSuccess: async () => {
      await refresh();
      toast.success('Atributo creado correctamente.');
    },
  }));
  const updateMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: AtributoDto }) => api.update(id, dto),
    onSuccess: async () => {
      await refresh();
      toast.success('Atributo actualizado correctamente.');
    },
  }));
  const removeMutation = injectMutation(() => ({
    mutationFn: (id: string) => api.remove(id),
    onSuccess: async () => {
      await refresh();
      toast.success('Atributo eliminado correctamente.');
    },
  }));

  return { listQuery, createMutation, updateMutation, removeMutation };
}
