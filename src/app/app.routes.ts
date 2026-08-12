import { Routes } from '@angular/router';

import { Sidebar } from './layout/sidebar/sidebar';

export const routes: Routes = [
  { path: '**', pathMatch: 'full', redirectTo: 'mantenimiento/marcas' },
  {
    path: '',
    component: Sidebar,
    children: [
      {
        path: 'mantenimiento',
        data: { breadcrumb: 'Matenimiento' },
        loadChildren: () => import('./feature/mantenimiento/mantenimiento.routes'),
      },
    ],
  },
];
