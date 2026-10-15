import { Component, input, output } from '@angular/core';
import { Icon } from '../../../../../shared/components/icon/icon';
import type { ProductStep } from '../productos-types';

@Component({
  selector: 'productos-step-navigation',
  imports: [Icon],
  templateUrl: './productos-step-navigation.html',
})
export class ProductosStepNavigation {
  readonly steps = input.required<readonly ProductStep[]>();
  readonly step = input.required<number>();
  readonly stepSelected = output<number>();
}
