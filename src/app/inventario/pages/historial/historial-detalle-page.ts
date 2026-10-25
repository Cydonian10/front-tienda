import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { useHistorialDetalle } from '../../actions/use-historial-action';
import { HistorialResumen } from './components/historial-resumen';
import { HistorialVariantes } from './components/historial-variantes';

@Component({
  selector: 'app-historial-detalle-page',
  imports: [RouterLink, EmptyState, Icon, HistorialResumen, HistorialVariantes],
  templateUrl: './historial-detalle-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HistorialDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly filtros = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly id = computed(() => this.params().get('id') ?? '');
  readonly movimiento = useHistorialDetalle(this.id);
  readonly filtrosRegreso = computed(() => {
    const params = this.filtros();
    return Object.fromEntries(
      ['q', 'tipo', 'desde', 'hasta', 'page', 'limit']
        .filter((key) => params.has(key))
        .map((key) => [key, params.get(key)]),
    );
  });
  readonly noEncontrado = computed(() => {
    const error = this.movimiento.error();
    return error instanceof HttpErrorResponse && (error.status === 400 || error.status === 404);
  });
}
