import { Routes } from '@angular/router';
import {
  confirmChangingSelection,
  confirmLeavingPage,
} from './pages/system-roles/guards/pending-permission/pending-permissions.guard';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { permissionGuard } from '../auth/guards/permission.guard';

const SYSTEM = 'ACCESS_CONTROL';

export const accessControlRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sistemas-roles',
  },
  {
    path: 'sistemas-roles',
    loadComponent: () => import('./pages/system-roles/system-roles.page'),
    canActivate: [permissionGuard(SYSTEM, PERMISSION_CODES.SYSTEM_READ), confirmChangingSelection],
    canDeactivate: [confirmLeavingPage],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
  },
  {
    path: 'usuarios',
    loadComponent: () => import('./pages/usuarios/usuarios.page'),
    canActivate: [permissionGuard(SYSTEM, PERMISSION_CODES.USERS_READ)],
  },
  {
    path: 'perfil',
    loadComponent: () => import('./pages/perfil/perfil.page'),
  },
  {
    path: 'permisos',
    loadComponent: () => import('./pages/permisos/permiso.page'),
    canActivate: [permissionGuard(SYSTEM, PERMISSION_CODES.PERMISSIONS_READ)],
  },
];

export default accessControlRoutes;
