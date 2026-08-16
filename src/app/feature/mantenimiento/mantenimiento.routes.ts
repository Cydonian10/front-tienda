import { Routes } from '@angular/router';

const MarcasPage: Routes = [
  {
    path: '',
    data: { breadcrumb: '' },
    children: [
      {
        path: 'marcas',
        data: { breadcrumb: 'Marcas' },
        loadComponent: () => import('./marcas/pages/marcas.page'),
        title: 'Marcas',
      },
      {
        path: 'categorias',
        data: { breadcrumb: 'Categorías' },
        loadComponent: () => import('./categories/categories.page'),
        title: 'Categorías',
      },
    ],
  },
];

export default MarcasPage;
