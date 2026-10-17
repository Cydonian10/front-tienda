import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../api/inventario/almacen-api';
import type {
  CreateAlmacenDto,
  UpdateAlmacenDto,
} from '../../api/interfaces/inventario/almacen.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const almacenesQueryKey = ['almacenes', 'listado'] as const;

export function useAlmacenes({
  page,
  limit,
  nombre,
  activo,
  enabled = true,
}: {
  page: () => number;
  limit: () => number;
  nombre: () => string;
  activo: () => boolean | undefined;
  enabled?: boolean;
}) {
  const api = inject(AlmacenApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);
  const refresh = () => client.invalidateQueries({ queryKey: ['almacenes'] });

  const listQuery = injectQuery(() => ({
    queryKey: [...almacenesQueryKey, page(), limit(), nombre(), activo()],
    queryFn: () => api.list(page(), limit(), nombre(), activo()),
    enabled,
    retry: false,
  }));
  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CreateAlmacenDto) => api.create(dto),
    onSuccess: async () => {
      await refresh();
      toast.success('Almacén creado correctamente.');
    },
  }));
  const updateMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateAlmacenDto }) => api.update(id, dto),
    onSuccess: async () => {
      await refresh();
      toast.success('Almacén actualizado correctamente.');
    },
  }));
  return { listQuery, createMutation, updateMutation };
}
