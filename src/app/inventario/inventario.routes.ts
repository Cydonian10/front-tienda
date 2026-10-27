import { Routes } from '@angular/router';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { permissionGuard } from '../auth/guards/permission.guard';
import {
  confirmChangingProduct,
  confirmLeavingProduct,
} from './pages/productos/guards/pending-product-changes.guard';
import { canLeaveMovimiento } from './pages/movimientos/guards/pending-movimiento.guard';

const inventarioRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/dashboard-reposicion/dashboard-reposicion-page'),
    canActivate: [permissionGuard('INVENTARIO', [PERMISSION_CODES.EXISTENCIAS_READ, PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ])],
  },
  {
    path: 'resumen',
    loadComponent: () => import('./pages/dashboard-reposicion/dashboard-reposicion-page'),
    canActivate: [permissionGuard('INVENTARIO', [PERMISSION_CODES.EXISTENCIAS_READ, PERMISSION_CODES.COMPRAS_READ, PERMISSION_CODES.MOVIMIENTOS_READ])],
  },
  {
    path: 'productos',
    loadComponent: () => import('./pages/productos/productos-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ)],
  },
  {
    path: 'productos/gestion',
    loadComponent: () => import('./pages/productos/gestion-productos-page'),
    canActivate: [
      permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ),
      confirmChangingProduct,
    ],
    canDeactivate: [confirmLeavingProduct],
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
  },
  {
    path: 'marcas',
    loadComponent: () => import('./pages/marcas/marcas-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ)],
    canDeactivate: [(page: import('./pages/marcas/marcas-page').default) => page.canLeave()],
  },
  {
    path: 'categorias',
    loadComponent: () => import('./pages/categorias/categorias-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PRODUCTS_READ)],
    canDeactivate: [(page: import('./pages/categorias/categorias-page').default) => page.canLeave()],
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
    path: 'proveedores',
    loadComponent: () => import('./pages/proveedores/proveedores-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.PROVEEDORES_READ)],
  },
  {
    path: 'proveedores/:id',
    loadComponent: () => import('./pages/proveedores/proveedor-detalle-page'),
    canActivate: [
      permissionGuard('INVENTARIO', PERMISSION_CODES.PROVEEDORES_READ),
      permissionGuard('INVENTARIO', PERMISSION_CODES.COMPRAS_READ),
    ],
  },
  {
    path: 'existencias',
    loadComponent: () => import('./pages/existencias/existencias-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.EXISTENCIAS_READ)],
  },
  {
    path: 'historial',
    loadComponent: () => import('./pages/historial/historial-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.MOVIMIENTOS_READ)],
  },
  {
    path: 'historial/:id',
    loadComponent: () => import('./pages/historial/historial-detalle-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.MOVIMIENTOS_READ)],
  },
  {
    path: 'movimientos',
    pathMatch: 'full',
    redirectTo: 'movimientos/salida',
  },
  ...(['salida', 'traslado', 'ajuste'] as const).map((tipo) => ({
    path: `movimientos/${tipo}`,
    loadComponent: () => import('./pages/movimientos/movimientos-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.MOVIMIENTOS_READ)],
    canDeactivate: [canLeaveMovimiento],
    data: { tipo },
  })),
  {
    path: 'compras/:id',
    loadComponent: () => import('./pages/compras/compra-detalle-page'),
    canActivate: [permissionGuard('INVENTARIO', PERMISSION_CODES.COMPRAS_READ)],
  },
];

export default inventarioRoutes;
