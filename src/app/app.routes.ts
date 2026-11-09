import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { AdminLayout } from './layouts/admin.layout';
import { resolverCatalogo } from './vsqz/catalogo-publico.resolver';

export const routes: Routes = [
  {
    path: 'vsqz',
    resolve: { catalogo: resolverCatalogo },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    loadComponent: () => import('./vsqz/catalogo-publico.page'),
    title: 'Servicios Generales Jauja | Catálogo',
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.routes'),
  },
  {
    path: 'admin',
    canActivateChild: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./system-portal/pages/my-systems.page'),
        title: 'Mis sistemas',
      },
      {
        path: 'access-control',
        component: AdminLayout,
        data: { systemCode: 'ACCESS_CONTROL' },
        children: [
          {
            path: '',
            loadChildren: () => import('./access-control/access-control.routes'),
          },
        ],
      },
      {
        path: 'inventario',
        component: AdminLayout,
        data: { systemCode: 'INVENTARIO' },
        children: [
          {
            path: '',
            loadChildren: () => import('./inventario/inventario.routes'),
          },
        ],
      },
      {
        path: 'ventas',
        component: AdminLayout,
        data: { systemCode: 'VENTAS' },
        children: [
          {
            path: '',
            loadChildren: () => import('./ventas/ventas.routes'),
          },
        ],
      },
    ],
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'vsqz',
  },
  {
    path: '**',
    redirectTo: 'vsqz',
  },
];
