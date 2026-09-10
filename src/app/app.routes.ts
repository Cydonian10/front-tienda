import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { Sidebar } from './layout/sidebar/sidebar';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./feature/auth/login.routes'),
  },
  {
    path: '',
    component: Sidebar,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () => import('./feature/dashboard/pages/dashboard.page'),
        title: 'Dashboard',
      },
      {
        path: 'mantenimiento',
        data: { breadcrumb: 'Mantenimiento' },
        loadChildren: () => import('./feature/mantenimiento/mantenimiento.routes'),
      },
      {
        path: 'operaciones',
        data: { breadcrumb: 'Operaciones' },
        loadChildren: () => import('./feature/operaciones/operaciones.routes'),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
