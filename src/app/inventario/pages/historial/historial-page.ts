import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HistorialFiltros } from './components/historial-filtros';
import { HistorialResultados } from './components/historial-resultados';
import {
  filtrarMovimientosHistorial,
  FiltroTipoHistorial,
  MOVIMIENTOS_HISTORIAL_DEMO,
} from './historial-demo.model';

@Component({
  selector: 'app-historial-page',
  imports: [HistorialFiltros, HistorialResultados],
  templateUrl: './historial-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HistorialPage {
  readonly busqueda = signal('');
  readonly tipo = signal<FiltroTipoHistorial>('todos');
  readonly movimientos = computed(() =>
    filtrarMovimientosHistorial(MOVIMIENTOS_HISTORIAL_DEMO, this.busqueda(), this.tipo()),
  );

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.tipo.set('todos');
  }
}
