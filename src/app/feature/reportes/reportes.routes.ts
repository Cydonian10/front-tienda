import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';
import { ROLE_NAMES } from '../../core/models/role.model';

const reportesRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard],
    data: {
      breadcrumb: 'Reportes',
      roles: [ROLE_NAMES.ADMINISTRATOR, ROLE_NAMES.RESPONSIBLE],
    },
    loadComponent: () => import('../../shared/empty-route/empty-route.page'),
    title: 'Reportes',
  },
];

export default reportesRoutes;
