import { Routes } from '@angular/router';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { permissionGuard } from '../auth/guards/permission.guard';

const inventarioRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'productos',
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ)],
  },
];

export default inventarioRoutes;
