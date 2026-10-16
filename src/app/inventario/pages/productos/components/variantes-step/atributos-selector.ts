import { Component, computed, input, output } from '@angular/core';
import type { AtributoProducto } from '../../../../../api/interfaces/inventario/producto.interface';

@Component({
  selector: 'atributos-selector',
  templateUrl: './atributos-selector.html',
})
export class AtributosSelector {
  readonly attributes = input.required<readonly AtributoProducto[]>();
  readonly locked = input(false);
  readonly busy = input(false);
  readonly toggle = output<AtributoProducto>();
  readonly selected = computed(() =>
    this.attributes().filter((attribute) => !!attribute.productoId),
  );
  readonly available = computed(() =>
    this.attributes().filter((attribute) => !attribute.productoId),
  );
}
