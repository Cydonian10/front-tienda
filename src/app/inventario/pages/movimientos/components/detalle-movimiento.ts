import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  cantidadBase,
  DetalleDemo,
  TipoMovimiento,
  VARIANTES_DEMO,
} from '../movimiento-demo.model';

@Component({
  selector: 'app-detalle-movimiento',
  imports: [Icon],
  templateUrl: './detalle-movimiento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class DetalleMovimiento {
  readonly fila = input.required<DetalleDemo>();
  readonly indice = input.required<number>();
  readonly tipo = input.required<TipoMovimiento>();
  readonly origen = input.required<string>();
  readonly cambio = output<DetalleDemo>();
  readonly quitar = output<void>();
  readonly variantes = VARIANTES_DEMO;
  readonly variante = computed(() =>
    this.variantes.find((item) => item.id === this.fila().varianteId),
  );
  readonly saldo = computed(() => this.variante()?.stock[this.origen()] ?? 0);
  readonly base = computed(() => cantidadBase(this.fila()));

  actualizar(campo: 'varianteId' | 'cantidad' | 'unidad' | 'costo', valor: string): void {
    this.cambio.emit({
      ...this.fila(),
      [campo]: valor,
      ...(campo === 'varianteId' ? { unidad: 'base' as const, costo: '' } : {}),
    });
  }
}
