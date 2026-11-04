import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';

export interface VentaReciente {
  id: string;
  caja: string;
  total: number;
}

@Component({
  selector: 'app-ventas-recientes',
  imports: [DecimalPipe],
  templateUrl: './ventas-recientes.html',
  host: { class: 'block' },
})
export class VentasRecientes {
  readonly ventas = input.required<readonly VentaReciente[]>();
  readonly verTicket = output<VentaReciente>();
}
