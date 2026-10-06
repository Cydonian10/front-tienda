import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RolesApi } from '../../../api/access-control/roles-api';
import { FilterRolesDto } from '../../../api/interfaces/access-control/role.interface';

export const rolesQueryKey = ['Roles'] as const;

export function findRolesQuery(filterDto: FilterRolesDto) {
  const api = inject(RolesApi);
  return injectQuery(() => ({
    queryKey: [...rolesQueryKey],
    queryFn: () => api.findAll(filterDto),
    enabled: !!filterDto.systemId,
    staleTime: 30_000,
    retry: false,
  }));
}
