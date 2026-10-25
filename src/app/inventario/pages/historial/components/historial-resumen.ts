import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { HistorialMovimientoDetalle } from '../../../../api/interfaces/inventario/historial-movimiento.interface';
import { etiquetaTipoHistorial } from '../historial-demo.model';

@Component({
  selector: 'app-historial-resumen',
  imports: [DatePipe],
  templateUrl: './historial-resumen.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialResumen {
  readonly movimiento = input.required<HistorialMovimientoDetalle>();
  readonly etiqueta = etiquetaTipoHistorial;
}
