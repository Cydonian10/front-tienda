import { inject } from '@angular/core';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';
import { CreateUserDto } from '../../../api/interfaces/access-control/usuario.interface';

export const useUsuariosQueryKey = ['Get-Usuarios'] as const;

export function useUsuariosQuery() {
  const usuariosApi = inject(UsuariosApi);

  const findUsuariosQuery = injectQuery(() => ({
    queryKey: [...useUsuariosQueryKey],
    queryFn: () => usuariosApi.findUsuarios(),
    staleTime: 30_000,
    retry: false,
  }));

  const addUsuarioMutation = injectMutation(() => ({
    mutationFn: (dto: CreateUserDto) => usuariosApi.create(dto),
    onSuccess: (user) => {
      // invalidar query
      // añadir el user sin tner que llamar a la api de neuvo
    },
  }));

  return {
    findUsuariosQuery,
  };
}
