import { Component } from '@angular/core';
import { CajasTurnosTarjeta } from './cajas-turnos-tarjeta';

@Component({
  selector: 'app-cajas-turnos-resumen',
  imports: [CajasTurnosTarjeta],
  templateUrl: './cajas-turnos-resumen.html',
  host: { class: 'block' },
})
export class CajasTurnosResumen {}
