import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ROLE_NAMES } from './core/models/role.model';
import { Sidebar } from './layout/sidebar/sidebar';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
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
        path: 'inicio',
        canActivate: [roleGuard],
        data: {
          breadcrumb: 'Inicio',
          roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
        },
        loadComponent: () => import('./feature/inicio/pages/inicio.page'),
        title: 'Inicio',
      },
      {
        path: 'mantenimiento',
        canActivate: [roleGuard],
        data: { breadcrumb: 'Mantenimiento', roles: [ROLE_NAMES.ADMINISTRATOR] },
        loadChildren: () => import('./feature/mantenimiento/mantenimiento.routes'),
      },
      {
        path: 'ventas',
        data: { breadcrumb: 'Ventas' },
        loadChildren: () => import('./feature/ventas/ventas.routes'),
      },
      {
        path: 'caja',
        data: { breadcrumb: 'Caja' },
        loadChildren: () => import('./feature/caja/caja.routes'),
      },
      {
        path: 'reportes',
        data: { breadcrumb: 'Reportes' },
        loadChildren: () => import('./feature/reportes/reportes.routes'),
      },
      {
        path: 'administracion',
        data: { breadcrumb: 'Administración' },
        loadChildren: () => import('./feature/administracion/administracion.routes'),
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
