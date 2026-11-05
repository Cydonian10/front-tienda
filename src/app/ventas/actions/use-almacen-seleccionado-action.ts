import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { AlmacenApi } from '../../api/inventario/almacen-api';

export function useAlmacenSeleccionado(almacenId: () => string) {
  const api = inject(AlmacenApi);

  return injectQuery(() => {
    const id = almacenId();
    return {
      queryKey: ['almacenes', 'seleccionado', id] as const,
      enabled: !!id,
      retry: false,
      queryFn: async () => {
        let page = 1;
        let totalPages: number;
        do {
          const resultado = await api.list(page, 100, '', true);
          const almacen = resultado.data.find((item) => item.id === id);
          if (almacen) return almacen;
          totalPages = resultado.meta.totalPages;
          page++;
        } while (page <= totalPages);
        return null;
      },
    };
  });
}
