import { Component, output } from '@angular/core';

@Component({
  selector: 'app-cajas-turnos-header',
  templateUrl: './cajas-turnos-header.html',
  host: { class: 'block' },
})
export class CajasTurnosHeader {
  readonly crearCaja = output<void>();
}
