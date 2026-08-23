import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { BaseProduct, BaseProductDetail } from '../../../../../core/models/base-product.model';

@Component({
  selector: 'product-base-selector',
  imports: [ReactiveFormsModule],
  templateUrl: './base-product-selector.component.html',
})
export class BaseProductSelector {
  readonly baseProducts = input.required<BaseProduct[]>();
  readonly baseProductId = input.required<FormControl<number | null>>();
  readonly page = input.required<number>();
  readonly lastPage = input.required<number>();
  readonly detail = input<BaseProductDetail | null>(null);
  readonly isLoadingDetail = input(false);

  readonly searchChanged = output<string>();
  readonly selected = output<number | null>();
  readonly previousPage = output<void>();
  readonly nextPage = output<void>();

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  protected onSelected(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.selected.emit(id || null);
  }
}
