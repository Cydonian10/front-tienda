import { Routes } from '@angular/router';

const LoginRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.page'),
    title: 'Iniciar sesión',
  },
];

export default LoginRoutes;
