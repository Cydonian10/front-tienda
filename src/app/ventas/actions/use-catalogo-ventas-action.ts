import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogoApi } from '../../api/ventas/catalogo/catalogo-api';
import type { FiltrosCatalogo } from '../../api/interfaces/ventas/catalogo.interface';

export function useCatalogoVentas(filtros: () => FiltrosCatalogo) {
  const api = inject(CatalogoApi);
  return injectQuery(() => {
    const actual = filtros();
    return {
      queryKey: ['ventas', 'catalogo', actual.almacenId, actual.q, actual.page, actual.limit] as const,
      queryFn: () => api.list(actual),
      enabled: !!actual.almacenId,
      retry: false,
    };
  });
}
