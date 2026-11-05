import { Component } from '@angular/core';
import { PuntoVentaCabecera } from './components/punto-venta-cabecera/punto-venta-cabecera';

@Component({
  selector: 'app-punto-venta-page',
  imports: [PuntoVentaCabecera],
  templateUrl: './punto-venta-page.html',
})
export default class PuntoVentaPage {}
