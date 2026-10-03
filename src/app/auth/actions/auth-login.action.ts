import { injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { LoginAuthDto } from '../../api/interfaces/access-control/auth.interface';
import { inject } from '@angular/core';
import { AuthApi } from '../../api/access-control/auth-api';

export function authLoginAction() {
  const authApi = inject(AuthApi);
  const queryClient = inject(QueryClient);

  return injectMutation(() => ({
    mutationFn: (dto: LoginAuthDto) => authApi.login(dto),
    onSuccess: (data) => {
      console.log(data);
      queryClient.invalidateQueries({ queryKey: ['login'] });
    },
  }));
}
