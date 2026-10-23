import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { etiquetaTipoHistorial, type MovimientoHistorialDemo } from '../historial-demo.model';

@Component({
  selector: 'app-historial-resultados',
  imports: [DatePipe, EmptyState, RouterLink],
  templateUrl: './historial-resultados.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialResultados {
  readonly movimientos = input.required<readonly MovimientoHistorialDemo[]>();
  readonly limpiar = output<void>();

  readonly etiqueta = etiquetaTipoHistorial;

  almacenes(movimiento: MovimientoHistorialDemo): string {
    return [movimiento.almacenOrigen, movimiento.almacenDestino].filter(Boolean).join(' → ');
  }
}
