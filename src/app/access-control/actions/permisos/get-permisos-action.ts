import { injectQuery } from '@tanstack/angular-query-experimental';
import { inject } from '@angular/core';

import { FilterPermision } from '../../../api/interfaces/access-control/permision.interface';
import { PermisosApi } from '../../../api/access-control/permisos-api';

export const getPermisosQueryKey = ['Get-Permisos'] as const;

export function getPermisosQuery(dto: FilterPermision = {}) {
  const permisosApi = inject(PermisosApi);
  return injectQuery(() => ({
    queryKey: [...getPermisosQueryKey, dto],
    queryFn: () => permisosApi.findPermisos(dto),
    staleTime: 30_000,
    retry: false,
  }));
}
