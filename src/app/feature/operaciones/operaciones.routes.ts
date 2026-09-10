import { Routes } from '@angular/router';

const operationsRoutes: Routes = [
  {
    path: 'cajas',
    data: { breadcrumb: 'Cajas' },
    loadComponent: () => import('./cajas/pages/cajas.page'),
    title: 'Cajas',
  },
];

export default operationsRoutes;
