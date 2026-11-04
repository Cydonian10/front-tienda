import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PreparacionVentaService } from '../services/preparacion-venta.service';

export const preparacionVentaGuard: CanActivateFn = () =>
  inject(PreparacionVentaService).seleccion() !== null ||
  inject(Router).parseUrl('/admin/ventas/preparacion');
