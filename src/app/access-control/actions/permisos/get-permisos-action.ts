import { injectQuery } from '@tanstack/angular-query-experimental';
import { inject } from '@angular/core';

import { PermisosApi } from '../../../api/access-control/permisos-api';

export const getPermisosQueryKey = ['Get-Permisos'] as const;

export function getPermisosQuery(systemCode: () => string | null) {
  const permisosApi = inject(PermisosApi);
  return injectQuery(() => {
    const code = systemCode();
    return {
      queryKey: [...getPermisosQueryKey, code],
      queryFn: () => permisosApi.findPermisos({ systemCode: code! }),
      enabled: !!code,
      staleTime: 30_000,
      retry: false,
    };
  });
}
