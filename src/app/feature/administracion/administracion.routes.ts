import { Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';
import { ROLE_NAMES } from '../../core/models/role.model';

const administracionRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard],
    data: { breadcrumb: 'Administración', roles: [ROLE_NAMES.ADMINISTRATOR] },
    loadComponent: () => import('../../shared/empty-route/empty-route.page'),
    title: 'Administración',
  },
];

export default administracionRoutes;
