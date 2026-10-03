import { inject } from '@angular/core';
import { injectQuery, queryOptions } from '@tanstack/angular-query-experimental';
import { AuthApi } from '../../api/access-control/auth-api';

export const authPerfilQueryKey = ['auth-perfil'] as const;

export function authPerfilQueryOptions(authApi: AuthApi) {
  return queryOptions({
    queryKey: authPerfilQueryKey,
    queryFn: () => authApi.perfil(),
    staleTime: 30_000,
    retry: false,
  });
}

export function AuthPerfilAction() {
  const authApi = inject(AuthApi);
  return injectQuery(() => authPerfilQueryOptions(authApi));
}
