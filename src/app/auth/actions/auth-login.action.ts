import { injectMutation } from '@tanstack/angular-query-experimental';
import { LoginAuthDto } from '../../api/interfaces/access-control/auth.interface';
import { inject } from '@angular/core';
import { AuthApi } from '../../api/access-control/auth-api';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthProfileService } from '../services/auth-profile.service';

export function authLoginAction() {
  const authApi = inject(AuthApi);
  const session = inject(AuthSessionService);
  const profile = inject(AuthProfileService);

  return injectMutation(() => ({
    mutationFn: (dto: LoginAuthDto) => authApi.login(dto),
    onSuccess: (data) => {
      profile.clear();
      session.set(data);
    },
  }));
}
