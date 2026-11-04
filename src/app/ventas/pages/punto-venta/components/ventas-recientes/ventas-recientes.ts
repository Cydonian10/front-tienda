import { Component, output } from '@angular/core';

@Component({
  selector: 'app-ventas-recientes',
  templateUrl: './ventas-recientes.html',
  host: { class: 'block' },
})
export class VentasRecientes {
  readonly verTicket = output<void>();
}
