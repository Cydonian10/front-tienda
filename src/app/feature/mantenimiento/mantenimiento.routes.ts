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
        loadComponent: () => import('./categories/pages/categories.page'),
        title: 'Categorías',
      },
      {
        path: 'base-products',
        data: { breadcrumb: 'Productos base' },
        loadComponent: () => import('./base-products/pages/base-products.page'),
        title: 'Productos base',
      },
    ],
  },
];

export default MarcasPage;
