import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OperationalRole } from '../models/role.model';
import { AuthStore } from '../store/auth.store';

export const roleGuard: CanActivateFn = (route) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const user = authStore.user();

  if (!authStore.isAuthenticated() || !user) {
    return router.createUrlTree(['/auth/login']);
  }

  const allowedRoles = route.data['roles'] as OperationalRole[] | undefined;
  if (allowedRoles?.some((role) => user.roles.includes(role))) {
    return true;
  }

  return router.createUrlTree(['/inicio']);
};
