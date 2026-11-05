import { Component, input } from '@angular/core';

@Component({
  selector: 'app-punto-venta-cabecera',
  templateUrl: './punto-venta-cabecera.html',
  host: { class: 'block' },
})
export class PuntoVentaCabecera {
  readonly almacen = input.required<string>();
  readonly caja = input.required<string>();
  readonly numeroTurno = input.required<string>();
  readonly responsable = input.required<string>();
}
