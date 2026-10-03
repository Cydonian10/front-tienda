import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((module) => module.authRoutes),
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./access-control/access-control').then((module) => module.accessControlRoutes),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
