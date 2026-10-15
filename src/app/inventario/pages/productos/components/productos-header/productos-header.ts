import { Component, input, output } from '@angular/core';
import { Icon } from '../../../../../shared/components/icon/icon';
import type { ProductMode } from '../productos-types';

@Component({
  selector: 'productos-header',
  imports: [Icon],
  templateUrl: './productos-header.html',
})
export class ProductosHeader {
  readonly mode = input.required<ProductMode>();
  readonly create = output<void>();
  readonly manage = output<void>();
}
