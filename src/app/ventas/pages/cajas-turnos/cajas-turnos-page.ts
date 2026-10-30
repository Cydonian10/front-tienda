import { Component } from '@angular/core';
import { CajasTurnosHeader } from './components/cajas-turnos-header';
import { CajasTurnosResumen } from './components/cajas-turnos-resumen';

@Component({
  selector: 'app-cajas-turnos-page',
  imports: [CajasTurnosHeader, CajasTurnosResumen],
  templateUrl: './cajas-turnos-page.html',
  providers: [],
  host: { class: 'block' },
})
export default class CajasTurnosPage {}
