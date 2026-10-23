import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { etiquetaTipoHistorial, type MovimientoHistorialDemo } from '../historial-demo.model';

@Component({
  selector: 'app-historial-resumen',
  imports: [DatePipe],
  templateUrl: './historial-resumen.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialResumen {
  readonly movimiento = input.required<MovimientoHistorialDemo>();
  readonly etiqueta = etiquetaTipoHistorial;
}
