import { Routes } from '@angular/router';
import { PERMISSION_CODES } from '../api/interfaces/access-control/permision.interface';
import { permissionGuard } from '../auth/guards/permission.guard';
import { preparacionVentaGuard } from './guards/preparacion-venta.guard';
import type PuntoVentaPage from './pages/punto-venta/punto-venta-page';

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
  {
    path: 'preparacion',
    loadComponent: () => import('./pages/preparacion-venta/preparacion-venta-page'),
    canActivate: [permissionGuard('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ)],
    title: 'Preparación de venta',
  },
  {
    path: 'punto-venta',
    loadComponent: () => import('./pages/punto-venta/punto-venta-page'),
    canActivate: [
      permissionGuard('VENTAS', PERMISSION_CODES.CAJAS_TURNOS_READ),
      preparacionVentaGuard,
    ],
    canDeactivate: [(pagina: PuntoVentaPage) => pagina.puedeSalir()],
    title: 'Punto de venta',
  },
];

export default ventasRoutes;
