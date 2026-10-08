import { Routes } from '@angular/router';
import { AdminLayout } from '../layouts/admin.layout';
import {
  confirmChangingSelection,
  confirmLeavingPage,
} from './pages/system-roles/pending-permissions.guard';

export const accessControlRoutes: Routes = [
  {
    path: '',
    component: AdminLayout,
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
