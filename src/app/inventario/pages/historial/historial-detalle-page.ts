import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { HistorialResumen } from './components/historial-resumen';
import { HistorialVariantes } from './components/historial-variantes';
import { MOVIMIENTOS_HISTORIAL_DEMO } from './historial-demo.model';

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
  readonly movimiento = computed(() =>
    MOVIMIENTOS_HISTORIAL_DEMO.find((item) => item.id === this.params().get('id')),
  );
}
