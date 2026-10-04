import { Routes } from '@angular/router';
import { AdminLayout } from '../layouts/admin.layout';

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
        loadComponent: () => import('./pages/roles/roles.page'),
      },
      {
        path: 'roles',
        pathMatch: 'full',
        redirectTo: 'sistemas-roles',
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
