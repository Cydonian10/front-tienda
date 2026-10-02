import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./access-control/access-control').then((module) => module.accessControlRoutes),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes').then((module) => module.authRoutes),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'admin/roles',
  },
  {
    path: '**',
    redirectTo: 'admin/roles',
  },
];
