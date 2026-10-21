import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ALMACENES_DEMO, TipoMovimiento } from '../movimiento-demo.model';

@Component({
  selector: 'app-datos-movimiento',
  templateUrl: './datos-movimiento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class DatosMovimiento {
  readonly tipo = input.required<TipoMovimiento>();
  readonly titulo = input.required<string>();
  readonly origen = input.required<string>();
  readonly destino = input.required<string>();
  readonly motivo = input.required<string>();
  readonly origenChange = output<string>();
  readonly destinoChange = output<string>();
  readonly motivoChange = output<string>();
  readonly almacenes = ALMACENES_DEMO;
}
