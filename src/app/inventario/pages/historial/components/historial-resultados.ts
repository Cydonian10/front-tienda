import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, type Params } from '@angular/router';
import type { HistorialMovimientoResumen, HistorialMovimientosPagina } from '../../../../api/interfaces/inventario/historial-movimiento.interface';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { etiquetaTipoHistorial } from '../historial-demo.model';

@Component({
  selector: 'app-historial-resultados',
  imports: [DatePipe, Pagination, RouterLink],
  templateUrl: './historial-resultados.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialResultados {
  readonly pagina = input.required<HistorialMovimientosPagina>();
  readonly queryParams = input.required<Params>();
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly etiqueta = etiquetaTipoHistorial;

  almacenes(movimiento: HistorialMovimientoResumen): string {
    return [movimiento.almacenOrigen, movimiento.almacenDestino].filter(Boolean).join(' → ') || 'No disponible';
  }
}
