import { Routes } from '@angular/router';

const MarcasPage: Routes = [
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
    data: { breadcrumb: 'Producto Base' },
    children: [
      {
        path: '',
        loadComponent: () => import('./base-products/pages/base-products.page'),
        title: 'Productos base',
      },
      {
        path: 'nuevo',
        data: { breadcrumb: 'Nuevo Producto Base' },
        loadComponent: () => import('./base-products/pages/new-base-product.page'),
        title: 'Nuevo Producto Base',
      },
    ],
  },
  {
    path: 'productos',
    data: { breadcrumb: 'Productos' },
    loadComponent: () => import('./products/pages/products.page'),
    title: 'Productos',
  },
];

export default MarcasPage;
