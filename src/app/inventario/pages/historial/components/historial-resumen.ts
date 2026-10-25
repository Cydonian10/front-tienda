import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { HistorialMovimientoDetalle } from '../../../../api/interfaces/inventario/historial-movimiento.interface';
import { formatearSoles } from '../../../../shared/formatters/decimal';
import { etiquetaTipoHistorial } from '../historial-presentacion.model';

@Component({
  selector: 'app-historial-resumen',
  imports: [DatePipe],
  templateUrl: './historial-resumen.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialResumen {
  readonly movimiento = input.required<HistorialMovimientoDetalle>();
  readonly etiqueta = etiquetaTipoHistorial;
  readonly soles = formatearSoles;
}
