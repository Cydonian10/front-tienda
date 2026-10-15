import { Component, input } from '@angular/core';
import type { ProductVariant } from '../productos-types';

@Component({
  selector: 'revision-step',
  templateUrl: './revision-step.html',
  host: { class: 'block' },
})
export class RevisionStep {
  readonly variants = input.required<readonly ProductVariant[]>();
}
