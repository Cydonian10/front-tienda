import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { VarianteApi } from '../../api/inventario/variante-api';
import type {
  CreateVarianteDto,
  VarianteResponse,
} from '../../api/interfaces/inventario/variante.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const variantesQueryKey = (productId: string) =>
  ['productos', productId, 'variantes'] as const;

export function useVarianteApi(productId: () => string) {
  const api = inject(VarianteApi);
  const queryClient = inject(QueryClient);
  const toast = inject(ToastService);

  const variantsQuery = injectQuery(() => ({
    queryKey: variantesQueryKey(productId()),
    queryFn: () => api.list(productId()),
    enabled: !!productId(),
    staleTime: 30_000,
    retry: false,
  }));

  const createMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: CreateVarianteDto }) => api.create(id, dto),
    onSuccess: async (variant, { id }) => {
      queryClient.setQueryData<VarianteResponse[]>(variantesQueryKey(id), (variants) =>
        variants
          ? [...variants.filter((item) => item.id !== variant.id), variant].sort((a, b) =>
              a.sku.localeCompare(b.sku),
            )
          : [variant],
      );
      await queryClient.invalidateQueries({ queryKey: variantesQueryKey(id) });
      toast.success('Variante creada correctamente.');
    },
  }));

  return { variantsQuery, createMutation };
}
