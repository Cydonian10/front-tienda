import { inject } from '@angular/core';
import { injectMutation, injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { UsuariosApi } from '../../../api/access-control/usuarios-api';
import {
  AddUserRoleDto,
  CreateUserDto,
  UpdateUserDto,
  UserRoleAssignment,
  Usuario,
} from '../../../api/interfaces/access-control/usuario.interface';

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

  const addRolesMutation = injectMutation(() => ({
    mutationFn: ({ userId, dto }: { userId: string; dto: AddUserRoleDto }) =>
      usuariosApi.addRoles(dto, userId),
    onSuccess: (assignment: UserRoleAssignment) => {
      queryClient.setQueryData<Usuario[]>([...useUsuariosQueryKey], (users) =>
        users?.map((user) => {
          if (user.id !== assignment.userId) return user;

          const roles = user.roles ?? [];
          if (roles.some((role) => role.id === assignment.id)) return user;

          return {
            ...user,
            roles: [
              ...roles,
              {
                id: assignment.id,
                roleId: assignment.roleId,
                name: assignment.rol,
                inicio: assignment.validFrom,
                fin: assignment.validUntil,
              },
            ],
          };
        }),
      );
    },
  }));

  return { findUsuariosQuery, createMutation, updateMutation, addRolesMutation };
}
