import { Component, inject } from '@angular/core';
import { CarritoVentaService, solesCentavos } from '../../service/carrito-venta.service';

@Component({
  selector: 'app-resumen-venta',
  templateUrl: './resumen-venta.html',
})
export class ResumenVenta {
  readonly carrito = inject(CarritoVentaService);
  readonly soles = solesCentavos;
}
