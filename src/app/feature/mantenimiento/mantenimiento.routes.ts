import { Routes } from '@angular/router';

const MarcasPage: Routes = [
  {
    path: '',
    data: { breadcrumb: '' },
    children: [
      {
        path: 'marcas',
        data: { breadcrumb: 'Marcas' },
        loadComponent: () => import('../mantenimiento/pages/marcas.page'),
        title: 'Marcas',
      },
    ],
  },
];

export default MarcasPage;
