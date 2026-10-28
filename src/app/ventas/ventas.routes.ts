import { Routes } from '@angular/router';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { permissionGuard } from '../auth/guards/permission.guard';

const ventasRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'cajas-turnos',
  },
  {
    path: 'cajas-turnos',
    loadComponent: () => import('./pages/cajas-turnos/cajas-turnos-page'),
    canActivate: [permissionGuard('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ)],
    title: 'Cajas y turnos',
  },
];

export default ventasRoutes;
