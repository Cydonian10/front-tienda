import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RolesApi } from '../../../api/access-control/roles-api';

export const rolesQueryKey = ['Roles'] as const;

export function rolesQuery() {
  const api = inject(RolesApi);
  return injectQuery(() => ({
    queryKey: [...rolesQueryKey],
    queryFn: () => api.findAll(),
    staleTime: 30_000,
    retry: false,
  }));
}
