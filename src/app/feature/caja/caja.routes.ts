import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';
import { ROLE_NAMES } from '../../core/models/role.model';

const cajaRoutes: Routes = [
  {
    path: 'mi-caja',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Mi caja',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
    },
    loadComponent: () => import('./mi-caja/pages/mi-caja.page'),
    title: 'Mi caja',
  },
  {
    path: 'sesiones',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Sesiones de caja',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('./sesiones/pages/sesiones.page'),
    title: 'Sesiones de caja',
  },
  {
    path: 'movimientos',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Movimientos de caja',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('./movimientos/pages/movimientos.page'),
    title: 'Movimientos de caja',
  },
];

export default cajaRoutes;
