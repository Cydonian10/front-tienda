import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionCode } from '../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../services/authorization.service';
import { AuthProfileService } from '../services/auth-profile.service';
import { AuthSessionService } from '../services/auth-session.service';

export function permissionGuard(systemCode: string, permissionCode: PermissionCode): CanActivateFn {
  return async (_, state) => {
    const router = inject(Router);
    const session = inject(AuthSessionService);
    const profile = inject(AuthProfileService);
    const authorization = inject(AuthorizationService);
    const login = () =>
      router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });

    if (!session.get()) return login();

    try {
      // No dependemos del orden de ejecución del guard de sesión para tener el perfil.
      await profile.load();
    } catch (error) {
      profile.clear();
      if (error instanceof HttpErrorResponse && error.status === 401) session.clear();
      return login();
    }

    return authorization.hasPermission(systemCode, permissionCode)
      ? true
      : router.createUrlTree(['/admin']);
  };
}
