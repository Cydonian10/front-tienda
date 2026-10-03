import { HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthProfileService } from '../services/auth-profile.service';
import { AuthSessionService } from '../services/auth-session.service';

export const guestGuard: CanActivateFn = async () => {
  const session = inject(AuthSessionService);
  const profile = inject(AuthProfileService);
  const router = inject(Router);

  if (!session.get()) {
    profile.clear();
    return true;
  }

  try {
    await profile.load();
    return router.createUrlTree(['/admin']);
  } catch (error) {
    profile.clear();
    if (error instanceof HttpErrorResponse && error.status === 401) session.clear();
    return true;
  }
};
