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
    path: 'unidades-medida',
    data: { breadcrumb: 'Unidades de medida' },
    loadComponent: () => import('./measurement-units/pages/measurement-units.page'),
    title: 'Unidades de medida',
  },
  {
    path: 'base-products',
    data: { breadcrumb: 'Producto Base' },
    children: [
      {
        path: '',
        loadComponent: () => import('./base-products/pages/list/base-products.page'),
        title: 'Productos base',
      },
      {
        path: 'nuevo',
        data: { breadcrumb: 'Nuevo Producto Base' },
        loadComponent: () => import('./base-products/pages/create/new-base-product.page'),
        title: 'Nuevo Producto Base',
      },
      {
        path: ':id/editar',
        data: { breadcrumb: 'Editar Producto Base' },
        loadComponent: () => import('./base-products/pages/edit/edit-base-product.page'),
        title: 'Editar Producto Base',
      },
    ],
  },
  {
    path: 'productos',
    data: { breadcrumb: 'Productos' },
    children: [
      {
        path: '',
        loadComponent: () => import('./products/pages/list/products.page'),
        title: 'Productos',
      },
      {
        path: 'nuevo',
        data: { breadcrumb: 'Nuevo Producto' },
        loadComponent: () => import('./products/pages/create/new-product.page'),
        title: 'Nuevo Producto',
      },
      {
        path: ':id/editar',
        data: { breadcrumb: 'Editar Producto' },
        loadComponent: () => import('./products/pages/edit/edit-product.page'),
        title: 'Editar Producto',
      },
      {
        path: ':id/imagenes',
        data: { breadcrumb: 'Imágenes' },
        loadComponent: () => import('./products/pages/product-images/product-images.page'),
        title: 'Imágenes del producto',
      },
    ],
  },
];

export default MarcasPage;
