import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';
import { ROLE_NAMES } from '../../core/models/role.model';

const ventasRoutes: Routes = [
  {
    path: 'nueva',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Nueva venta',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE, ROLE_NAMES.WORKER],
    },
    loadComponent: () => import('./pos/pages/venta.page'),
    title: 'Nueva venta',
  },
  {
    path: 'historial',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Historial de ventas',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('./historial/pages/historial-ventas.page'),
    title: 'Historial de ventas',
  },
];

export default ventasRoutes;
