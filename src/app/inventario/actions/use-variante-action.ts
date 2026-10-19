import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { VarianteApi } from '../../api/inventario/variante-api';
import type {
  CreateVarianteDto,
  UpdateVarianteDto,
  VarianteResponse,
} from '../../api/interfaces/inventario/variante.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const variantesQueryKey = (productId: string) =>
  ['productos', productId, 'variantes'] as const;
export const varianteImagenesKey = (productId: string, variantId: string) =>
  ['productos', productId, 'galerias-variante', variantId] as const;
export const varianteImagenesQueryKey = (productId: string, variantId: string) =>
  [...varianteImagenesKey(productId, variantId), 'imagenes'] as const;
export const varianteImagenQueryKey = (productId: string, variantId: string, imageId: string) =>
  [...varianteImagenesKey(productId, variantId), 'archivos', imageId] as const;

export function useVarianteImagenes(productId: () => string, variantId: () => string) {
  const api = inject(VarianteApi);
  return injectQuery(() => {
    const [id, variant] = [productId(), variantId()];
    return {
      queryKey: varianteImagenesQueryKey(id, variant),
      queryFn: () => api.listImages(id, variant),
      enabled: !!id && !!variant,
      retry: false,
    };
  });
}

export function useVarianteImagen(
  productId: () => string,
  variantId: () => string,
  imageId: () => string,
) {
  const api = inject(VarianteApi);
  return injectQuery(() => {
    const [id, variant, image] = [productId(), variantId(), imageId()];
    return {
      queryKey: varianteImagenQueryKey(id, variant, image),
      queryFn: () => api.getImage(id, variant, image),
      enabled: !!id && !!variant && !!image,
      retry: false,
    };
  });
}

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
      await queryClient.invalidateQueries({ queryKey: variantesQueryKey(id), exact: true });
      toast.success('Variante creada correctamente.');
    },
  }));

  const updateMutation = injectMutation(() => ({
    mutationFn: ({ id, variantId, dto }: { id: string; variantId: string; dto: UpdateVarianteDto }) =>
      api.update(id, variantId, dto),
    onSuccess: async (variant, { id, variantId, dto }) => {
      queryClient.setQueryData<VarianteResponse[]>(variantesQueryKey(id), (variants) =>
        variants?.map((item) => (item.id === variantId ? variant : item)),
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: variantesQueryKey(id), exact: true }),
        ...(dto.imagenesConservarIds !== undefined || dto.imagenes?.length
          ? [queryClient.invalidateQueries({ queryKey: varianteImagenesKey(id, variantId) })]
          : []),
      ]);
      toast.success('Variante actualizada correctamente.');
    },
  }));

  return { variantsQuery, createMutation, updateMutation };
}
