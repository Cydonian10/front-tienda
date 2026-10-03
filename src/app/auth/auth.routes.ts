import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth.layout';
import { guestGuard } from './guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./pages/login/login.page'),
      },
    ],
  },
];

export default authRoutes;
