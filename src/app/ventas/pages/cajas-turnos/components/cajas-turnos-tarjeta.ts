import { Component, input } from '@angular/core';

@Component({
  selector: 'app-cajas-turnos-tarjeta',
  templateUrl: './cajas-turnos-tarjeta.html',
  host: { class: 'block min-w-0' },
})
export class CajasTurnosTarjeta {
  readonly titulo = input.required<string>();
}
