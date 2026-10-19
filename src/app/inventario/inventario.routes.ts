import { Routes } from '@angular/router';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { permissionGuard } from '../auth/guards/permission.guard';
import {
  confirmChangingProduct,
  confirmLeavingProduct,
} from './pages/productos/guards/pending-product-changes.guard';

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
  {
    path: 'productos/gestion',
    loadComponent: () => import('./pages/productos/gestion-productos-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ), confirmChangingProduct],
    canDeactivate: [confirmLeavingProduct],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
  },
  {
    path: 'unidades',
    loadComponent: () => import('./pages/unidades/unidades-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.UNIDADES_READ)],
  },
  {
    path: 'atributos',
    loadComponent: () => import('./pages/atributos/atributos-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.ATRIBUTOS_READ)],
  },
  {
    path: 'almacenes',
    loadComponent: () => import('./pages/almacenes/almacenes-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.ALMACENES_READ)],
  },
  {
    path: 'compras',
    loadComponent: () => import('./pages/compras/compras-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.COMPRAS_READ)],
  },
  {
    path: 'existencias',
    loadComponent: () => import('./pages/existencias/existencias-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.EXISTENCIAS_READ)],
  },
  {
    path: 'compras/:id',
    loadComponent: () => import('./pages/compras/compra-detalle-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.COMPRAS_READ)],
  },
  {
    path: 'producto-prueba',
    loadComponent: () => import('./pages/producto-prueba/producto-prueba-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ)],
  },
];

export default inventarioRoutes;
