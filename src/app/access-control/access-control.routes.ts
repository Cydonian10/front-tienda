import { Routes } from '@angular/router';
import { AdminLayout } from '../layouts/admin.layout';
import {
  confirmChangingSelection,
  confirmLeavingPage,
} from './pages/system-roles/guards/pending-permission/pending-permissions.guard';
import { systemMenuResolver } from '../system-portal/services/control-access/system-menu.resolver';

export const accessControlRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('../system-portal/pages/my-systems.page'),
    title: 'Mis sistemas',
  },
  {
    path: 'access-control',
    component: AdminLayout,
    data: { systemCode: 'ACCESS_CONTROL' },
    resolve: { systemMenu: systemMenuResolver },
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'sistemas-roles',
      },
      {
        path: 'sistemas-roles',
        loadComponent: () => import('./pages/system-roles/system-roles.page'),
        canActivate: [confirmChangingSelection],
        canDeactivate: [confirmLeavingPage],
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
      },
      {
        path: 'pruebas',
        loadComponent: () => import('./pages/roles/roles.page'),
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios.page'),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./pages/perfil/perfil.page'),
      },
      {
        path: 'permisos',
        loadComponent: () => import('./pages/permisos/permiso.page'),
      },
    ],
  },
];

export default accessControlRoutes;
