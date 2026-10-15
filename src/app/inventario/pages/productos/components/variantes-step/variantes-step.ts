import { Component, input } from '@angular/core';
import { Icon } from '../../../../../shared/components/icon/icon';
import type { ProductVariant } from '../productos-types';

@Component({
  selector: 'variantes-step',
  imports: [Icon],
  templateUrl: './variantes-step.html',
  host: { class: 'block' },
})
export class VariantesStep {
  readonly attributes = input.required<readonly string[]>();
  readonly variants = input.required<readonly ProductVariant[]>();
}
