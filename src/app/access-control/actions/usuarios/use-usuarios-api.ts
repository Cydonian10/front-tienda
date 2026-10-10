import { inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';

export const useUsuariosQueryKey = ['Get-Usuarios'] as const;

export function useUsuariosQuery() {
  const usuariosApi = inject(UsuariosApi);

  const findUsuariosQuery = injectQuery(() => ({
    queryKey: [...useUsuariosQueryKey],
    queryFn: () => usuariosApi.findUsuarios(),
    staleTime: 30_000,
    retry: false,
  }));

  return {
    findUsuariosQuery,
  };
}
