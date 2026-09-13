import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';
import { ROLE_NAMES } from '../../core/models/role.model';

const reportesRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'resumen',
  },
  {
    path: 'resumen',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Resumen',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('./resumen/resumen-reportes.page'),
    title: 'Resumen de reportes',
  },
  {
    path: 'ventas',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Ventas',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('./ventas/ventas-reportes.page'),
    title: 'Ventas por día',
  },
  {
    path: 'vendedores',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Vendedores',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('./vendedores/vendedores-reportes.page'),
    title: 'Rendimiento de vendedores',
  },
];

export default reportesRoutes;
