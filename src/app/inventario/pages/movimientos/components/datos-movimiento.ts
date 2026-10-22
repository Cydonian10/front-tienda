import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { AlmacenMovimiento, TipoMovimiento } from '../../../../api/interfaces/inventario/movimiento.interface';

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
  readonly almacenes = input.required<readonly AlmacenMovimiento[]>();
  readonly cargandoAlmacenes = input.required<boolean>();
  readonly errorAlmacenes = input.required<boolean>();
  readonly origenChange = output<string>();
  readonly destinoChange = output<string>();
  readonly motivoChange = output<string>();
  readonly reintentarAlmacenes = output<void>();
}
