import { Routes } from '@angular/router';

import { AdminLayout } from './layout/admin-layout/admin-layout';
import { FormLayout } from './pages/form-layout/form-layout';
import { Sidebar } from './layout/sidebar/sidebar';

export const routes: Routes = [
  {
    path: '',
    component: Sidebar,
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
