import { Routes } from '@angular/router';

import { Sidebar } from './layout/sidebar/sidebar';

export const routes: Routes = [
  {
    path: '',
    component: Sidebar,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ui-kit/form-layout' },
      {
        path: 'mantenimiento',
        data: { breadcrumb: 'Matenimiento' },
        loadChildren: () => import('./feature/mantenimiento/mantenimiento.routes'),
      },
    ],
  },
];
