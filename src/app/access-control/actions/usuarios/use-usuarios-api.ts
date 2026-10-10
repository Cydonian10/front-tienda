import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';
import { CreateUserDto, Usuario } from '../../../api/interfaces/access-control/usuario.interface';

export const useUsuariosQueryKey = ['Get-Usuarios'] as const;

export function useUsuariosQuery() {
  const usuariosApi = inject(UsuariosApi);

  const findUsuariosQuery = injectQuery(() => ({
    queryKey: [...useUsuariosQueryKey],
    queryFn: () => usuariosApi.findUsuarios(),
    staleTime: 30_000,
    retry: false,
  }));

  return { findUsuariosQuery };
}

export function useCreateUsuarioMutation() {
  const usuariosApi = inject(UsuariosApi);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (dto: CreateUserDto) => usuariosApi.create(dto),
    onSuccess: (user) => {
      queryClient.setQueryData<Usuario[]>([...useUsuariosQueryKey], (users) =>
        users ? [user, ...users] : [user],
      );
    },
  }));
}
