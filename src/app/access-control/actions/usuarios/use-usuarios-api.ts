import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';
import { CreateUserDto, UpdateUserDto, Usuario } from '../../../api/interfaces/access-control/usuario.interface';

export const useUsuariosQueryKey = ['Get-Usuarios'] as const;

export function useUsuariosApi() {
  const usuariosApi = inject(UsuariosApi);
  const queryClient = inject(QueryClient);

  const findUsuariosQuery = injectQuery(() => ({
    queryKey: [...useUsuariosQueryKey],
    queryFn: () => usuariosApi.findUsuarios(),
    staleTime: 30_000,
    retry: false,
  }));

  const createMutation = injectMutation(() => ({
    mutationFn: (dto: CreateUserDto) => usuariosApi.create(dto),
    onSuccess: (user) => {
      queryClient.setQueryData<Usuario[]>([...useUsuariosQueryKey], (users) =>
        users ? [user, ...users] : [user],
      );
    },
  }));

  const updateMutation = injectMutation(() => ({
    mutationFn: ({ userId, dto }: { userId: string; dto: UpdateUserDto }) =>
      usuariosApi.update(dto, userId),
    onSuccess: (user) => {
      queryClient.setQueryData<Usuario[]>([...useUsuariosQueryKey], (users) =>
        users?.map((item) =>
          item.id === user.id
            ? { ...user, roles: user.roles?.length ? user.roles : item.roles }
            : item,
        ),
      );
    },
  }));

  return { findUsuariosQuery, createMutation, updateMutation };
}
