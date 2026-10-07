import { injectQuery } from '@tanstack/angular-query-experimental';
import { inject } from '@angular/core';

import { PermisosApi } from '../../../api/access-control/permisos-api';
import { FilterPermision } from '../../../api/interfaces/access-control/permision.interface';

export const getPermisosQueryKey = ['Get-Permisos'] as const;

export function getPermisosQuery(callbackFilter: () => FilterPermision | undefined) {
  const permisosApi = inject(PermisosApi);
  return injectQuery(() => {
    const filterDto = callbackFilter();
    return {
      queryKey: [...getPermisosQueryKey, filterDto?.roleId],
      queryFn: () => permisosApi.findPermisos(filterDto),
      enabled: !!filterDto?.roleId,
      staleTime: 30_000,
      retry: false,
    };
  });
}
