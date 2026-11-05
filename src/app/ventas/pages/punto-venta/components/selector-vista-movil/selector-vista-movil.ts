import { Component, input, output } from '@angular/core';

export type VistaPuntoVenta = 'productos' | 'venta';

@Component({
  selector: 'app-selector-vista-movil',
  templateUrl: './selector-vista-movil.html',
  host: { class: 'block xl:hidden' },
})
export class SelectorVistaMovil {
  readonly vista = input.required<VistaPuntoVenta>();
  readonly cantidadLineas = input(0);
  readonly vistaChange = output<VistaPuntoVenta>();
}
