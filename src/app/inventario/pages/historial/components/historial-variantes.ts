import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { HistorialMovimientoLinea } from '../../../../api/interfaces/inventario/historial-movimiento.interface';

@Component({
  selector: 'app-historial-variantes',
  templateUrl: './historial-variantes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialVariantes {
  readonly detalles = input.required<readonly HistorialMovimientoLinea[]>();
}
