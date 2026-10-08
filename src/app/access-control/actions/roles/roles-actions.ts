import { inject } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
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

export function handleRoles() {
  const api = inject(RolesApi);

  const mutationReplacePermission = injectMutation(() => ({
    mutationFn: (dto: { rolId: string; permissionIds: string[] }) =>
      api.replacePermissions(dto.rolId, dto.permissionIds),
  }));

  const mutationDeletePermission = injectMutation(() => ({
    mutationFn: (rolId: string) => api.delete(rolId),
  }));

  return {
    mutationReplacePermission,
    mutationDeletePermission,
  };
}
