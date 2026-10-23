import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { DetalleHistorialDemo } from '../historial-demo.model';

@Component({
  selector: 'app-historial-variantes',
  templateUrl: './historial-variantes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialVariantes {
  readonly detalles = input.required<readonly DetalleHistorialDemo[]>();
}
