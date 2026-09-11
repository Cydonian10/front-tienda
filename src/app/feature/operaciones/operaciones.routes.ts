import { Routes } from '@angular/router';

const operationsRoutes: Routes = [
  {
    path: 'cajas',
    data: { breadcrumb: 'Cajas' },
    loadComponent: () => import('./cajas/pages/cajas.page'),
    title: 'Cajas',
  },
  {
    path: 'ventas',
    data: { breadcrumb: 'Ventas' },
    loadComponent: () => import('./ventas/pages/ventas.page'),
    title: 'Ventas',
  },
];

export default operationsRoutes;
