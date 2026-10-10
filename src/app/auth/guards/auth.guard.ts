import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthProfileService } from '../services/auth-profile.service';

export const authGuard: CanActivateChildFn = async (_, state) => {
  const session = inject(AuthSessionService);
  const profile = inject(AuthProfileService);
  const router = inject(Router);
  const login = () =>
    router.createUrlTree(['/auth/login'], { queryParams: { returnUrl: state.url } });

  if (!session.get()) {
    profile.clear();
    return login();
  }

  try {
    await profile.load(true);
    return true;
  } catch (error) {
    profile.clear();
    if (error instanceof HttpErrorResponse && error.status === 401) session.clear();
    return login();
  }
};
