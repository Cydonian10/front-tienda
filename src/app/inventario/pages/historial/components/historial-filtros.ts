import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FiltroTipoHistorial } from '../historial-demo.model';

@Component({
  selector: 'app-historial-filtros',
  templateUrl: './historial-filtros.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialFiltros {
  readonly busqueda = input.required<string>();
  readonly tipo = input.required<FiltroTipoHistorial>();
  readonly desde = input.required<string>();
  readonly hasta = input.required<string>();
  readonly busquedaChange = output<string>();
  readonly tipoChange = output<FiltroTipoHistorial>();
  readonly desdeChange = output<string>();
  readonly hastaChange = output<string>();

  elegirTipo(valor: string): void {
    if (['todos', 'ingreso', 'salida', 'traslado', 'ajuste'].includes(valor)) {
      this.tipoChange.emit(valor as FiltroTipoHistorial);
    }
  }
}
