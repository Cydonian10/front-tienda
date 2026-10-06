import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RolesApi } from '../../../api/access-control/roles-api';

export const rolesQueryKey = ['Roles'] as const;

export function findRolesQuery(systemId: () => string | undefined) {
  const api = inject(RolesApi);

  return injectQuery(() => {
    const id = systemId();
    return {
      queryKey: [...rolesQueryKey, id],
      queryFn: () => api.findAll({ systemId: id }),
      enabled: !!id,
      staleTime: 30_000,
      retry: false,
    };
  });
}
