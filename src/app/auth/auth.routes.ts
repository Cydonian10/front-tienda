import { Routes } from '@angular/router';
import { AuthLayout } from './layouts/auth.layout';

export const authRoutes: Routes = [
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/login/login.page'),
      },
    ],
  },
];

export default authRoutes;
