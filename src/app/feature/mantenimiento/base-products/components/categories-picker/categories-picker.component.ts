import { Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Category } from '../../../../../core/models/category.model';

@Component({
  selector: 'base-product-categories-picker',
  templateUrl: './categories-picker.component.html',
  host: {
    class: 'block',
  },
})
export class BaseProductCategoriesPicker {
  readonly categories = input.required<Category[]>();
  readonly control = input.required<FormControl<number[]>>();

  protected isSelected(id: number): boolean {
    return this.control().value.includes(id);
  }

  protected toggle(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.control().value;
    this.control().setValue(
      checked ? [...current, id] : current.filter((categoryId) => categoryId !== id),
    );
  }
}
