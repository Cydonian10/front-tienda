import { Routes } from '@angular/router';

import { AdminLayout } from './layout/admin-layout/admin-layout';
import { FormLayout } from './pages/form-layout/form-layout';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'ui-kit/form-layout' },
      {
        path: 'ui-kit/form-layout',
        component: FormLayout,
        title: 'Form Layout · Atlantis',
      },
    ],
  },
];
