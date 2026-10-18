import { Component, computed, input, output } from '@angular/core';
import type { ExistenciaItem } from '../../../../api/interfaces/inventario/existencia.interface';
import { descomponerUnidadBase, nombreUnidad } from '../existencia-unidades.model';

@Component({
  selector: 'app-existencia-unidad',
  templateUrl: './existencia-unidad.html',
  host: { class: 'block min-w-0' },
})
export class ExistenciaUnidad {
  readonly fila = input.required<ExistenciaItem>();
  readonly unidadId = input<string | null>(null);
  readonly unidadChange = output<string | null>();

  readonly unidad = computed(() =>
    this.fila().unidadesSecundarias.find((item) => item.id === this.unidadId()),
  );
  readonly conversion = computed(() => {
    const fila = this.fila();
    const unidad = this.unidad();
    if (!unidad) return null;
    const partes = descomponerUnidadBase(fila.cantidadBase, unidad.factorABase);
    if (!partes) return null;
    const completas = `${partes.completas} ${nombreUnidad(unidad.nombre, partes.completas)}`;
    return partes.restoBase === '0'
      ? completas
      : `${completas} + ${partes.restoBase} ${nombreUnidad(fila.producto.unidadBase.nombre, partes.restoBase)} base`;
  });

  cambiarUnidad(id: string): void {
    this.unidadChange.emit(id || null);
  }
}
