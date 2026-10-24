import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { MarcaApi } from '../../api/inventario/marca-api';
import type { CrearMarcaDto, EditarMarcaDto, Marca } from '../../api/interfaces/inventario/marca.interface';
import type { ProductResponse } from '../../api/interfaces/inventario/producto.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const marcasListadoKey = ['marcas', 'listado'] as const;
export const marcasListadoQueryKey = (q: string, activo: boolean | undefined, page: number, limit: number) =>
  [...marcasListadoKey, q, activo ?? null, page, limit] as const;
export const marcaDetalleQueryKey = (id: string) => ['marcas', id, 'detalle'] as const;
export const marcaImagenKey = (id: string) => ['marcas', id, 'imagen'] as const;
export const marcaImagenQueryKey = (id: string, imageId: string) => [...marcaImagenKey(id), imageId] as const;

export function useMarcasListado(
  q: () => string, activo: () => boolean | undefined, page: () => number, limit: () => number,
) {
  const api = inject(MarcaApi);
  return injectQuery(() => {
    const term = q().trim();
    const [status, currentPage, pageSize] = [activo(), page(), limit()];
    const search = term.length >= 2 ? term : '';
    return {
      queryKey: marcasListadoQueryKey(search, status, currentPage, pageSize),
      queryFn: () => api.list({ ...(search ? { q: search } : {}), activo: status, page: currentPage, limit: pageSize }),
      retry: false,
    };
  });
}

export function useMarcaDetalle(id: () => string) {
  const api = inject(MarcaApi);
  return injectQuery(() => {
    const marcaId = id();
    return {
      queryKey: marcaDetalleQueryKey(marcaId),
      queryFn: () => api.getById(marcaId),
      enabled: !!marcaId,
      retry: false,
    };
  });
}

export function useMarcaImagen(id: () => string, imageId: () => string) {
  const api = inject(MarcaApi);
  return injectQuery(() => {
    const [marcaId, fileId] = [id(), imageId()];
    return {
      queryKey: marcaImagenQueryKey(marcaId, fileId),
      queryFn: () => api.getImage(marcaId),
      enabled: !!marcaId && !!fileId,
      retry: false,
    };
  });
}

export function useMarcasApi() {
  const api = inject(MarcaApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);
  const invalidateProductDetails = (id: string) => client.invalidateQueries({
    predicate: (query) => query.queryKey[0] === 'productos' && query.queryKey[2] === 'detalle' &&
      (query.state.data as ProductResponse | undefined)?.marca?.id === id,
  });
  const refresh = async (id: string, imageChanged: boolean) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: marcasListadoKey }),
      client.invalidateQueries({ queryKey: marcaDetalleQueryKey(id), exact: true }),
      invalidateProductDetails(id),
      ...(imageChanged ? [client.invalidateQueries({ queryKey: marcaImagenKey(id) })] : []),
    ]);
  };

  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CrearMarcaDto) => api.create(dto),
    onSuccess: async (marca: Marca) => {
      client.setQueryData(marcaDetalleQueryKey(marca.id), marca);
      await client.invalidateQueries({ queryKey: marcasListadoKey });
      toast.success('Marca creada correctamente.');
    },
  }));
  const updateMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: EditarMarcaDto }) => api.update(id, dto),
    onSuccess: async (marca: Marca, { id, dto }) => {
      client.setQueryData(marcaDetalleQueryKey(id), marca);
      await refresh(id, !!dto.imagen || !!dto.quitarImagen);
      toast.success('Marca actualizada correctamente.');
    },
  }));
  const statusMutation = injectMutation(() => ({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.changeStatus(id, activo),
    onSuccess: async (marca: Marca, { id }) => {
      client.setQueryData(marcaDetalleQueryKey(id), marca);
      await refresh(id, false);
      toast.success('Estado de la marca actualizado.');
    },
  }));
  return { createMutation, updateMutation, statusMutation };
}
