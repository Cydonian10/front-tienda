import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { CategoriaApi } from '../../api/inventario/categoria-api';
import type { Categoria, CrearCategoriaDto, EditarCategoriaDto } from '../../api/interfaces/inventario/categoria.interface';
import type { ProductResponse } from '../../api/interfaces/inventario/producto.interface';
import { ToastService } from '../../shared/services/toast/toast.service';

export const categoriasListadoKey = ['categorias', 'listado'] as const;
export const categoriasListadoQueryKey = (q: string, activo: boolean | undefined, page: number, limit: number) =>
  [...categoriasListadoKey, q, activo ?? null, page, limit] as const;
export const categoriaDetalleQueryKey = (id: string) => ['categorias', id, 'detalle'] as const;

export function useCategoriasListado(
  q: () => string, activo: () => boolean | undefined, page: () => number, limit: () => number,
  enabled: () => boolean = () => true,
) {
  const api = inject(CategoriaApi);
  return injectQuery(() => {
    const term = q().trim();
    const [status, currentPage, pageSize] = [activo(), page(), limit()];
    const search = term.length >= 2 ? term : '';
    return {
      queryKey: categoriasListadoQueryKey(search, status, currentPage, pageSize),
      queryFn: () => api.list({ ...(search ? { q: search } : {}), activo: status, page: currentPage, limit: pageSize }),
      enabled: enabled(),
      retry: false,
    };
  });
}

export function useCategoriaDetalle(id: () => string) {
  const api = inject(CategoriaApi);
  return injectQuery(() => {
    const categoryId = id();
    return {
      queryKey: categoriaDetalleQueryKey(categoryId),
      queryFn: () => api.getById(categoryId),
      enabled: !!categoryId,
      retry: false,
    };
  });
}

export function useCategoriasApi() {
  const api = inject(CategoriaApi);
  const client = inject(QueryClient);
  const toast = inject(ToastService);
  const refresh = async (id: string) => {
    await Promise.all([
      client.invalidateQueries({ queryKey: categoriasListadoKey }),
      client.invalidateQueries({ queryKey: categoriaDetalleQueryKey(id), exact: true }),
      client.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'productos' && query.queryKey[2] === 'detalle' &&
          !!(query.state.data as ProductResponse | undefined)?.categorias?.some((category) => category.id === id),
      }),
    ]);
  };

  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CrearCategoriaDto) => api.create(dto),
    onSuccess: async (categoria: Categoria) => {
      client.setQueryData(categoriaDetalleQueryKey(categoria.id), categoria);
      await client.invalidateQueries({ queryKey: categoriasListadoKey });
      toast.success('Categoría creada correctamente.');
    },
  }));
  const updateMutation = injectMutation(() => ({
    mutationFn: ({ id, dto }: { id: string; dto: EditarCategoriaDto }) => api.update(id, dto),
    onSuccess: async (categoria: Categoria, { id }) => {
      client.setQueryData(categoriaDetalleQueryKey(id), categoria);
      await refresh(id);
      toast.success('Categoría actualizada correctamente.');
    },
  }));
  const statusMutation = injectMutation(() => ({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) => api.changeStatus(id, activo),
    onSuccess: async (categoria: Categoria, { id }) => {
      client.setQueryData(categoriaDetalleQueryKey(id), categoria);
      await refresh(id);
      toast.success('Estado de la categoría actualizado.');
    },
  }));
  return { createMutation, updateMutation, statusMutation };
}
