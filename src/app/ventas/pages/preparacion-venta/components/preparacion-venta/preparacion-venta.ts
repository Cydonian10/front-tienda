import { Component, input, output } from '@angular/core';
import { PreparacionVentaHeader } from '../preparacion-venta-header/preparacion-venta-header';
import type { Almacen } from '../../../../../api/interfaces/inventario/almacen.interface';

@Component({
  selector: 'app-preparacion-venta',
  imports: [PreparacionVentaHeader],
  templateUrl: './preparacion-venta.html',
  host: { class: 'block' },
})
export class PreparacionVenta {
  readonly almacenes = input.required<readonly Almacen[]>();
  readonly turnos = input.required<readonly { id: string; nombre: string }[]>();
  readonly almacenesCargando = input(false);
  readonly almacenesError = input(false);
  readonly turnosCargando = input(false);
  readonly turnosError = input(false);
  readonly reintentarAlmacenes = output<void>();
  readonly reintentarTurnos = output<void>();
  readonly almacen = input.required<string>();
  readonly turno = input.required<string>();
  readonly almacenChange = output<string>();
  readonly turnoChange = output<string>();
  readonly continuar = output<void>();

  seleccionar(event: Event, campo: 'almacen' | 'turno'): void {
    const valor = (event.target as HTMLSelectElement).value;
    if (campo === 'almacen') this.almacenChange.emit(valor);
    else this.turnoChange.emit(valor);
  }
}
