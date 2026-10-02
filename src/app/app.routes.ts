import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'acces-control',
    loadChildren: () =>
      import('./access-control/access-control').then((module) => module.accessControlRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((module) => module.authRoutes),
  },
];
