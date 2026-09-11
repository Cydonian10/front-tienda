import { Component, input, output } from '@angular/core';

import { PaginatedResult } from '../../../../../core/models/pagination.model';
import { Product } from '../../../../../core/models/product.model';

@Component({
  selector: 'sales-product-picker',
  templateUrl: './sales-product-picker.html',
})
export class SalesProductPicker {
  readonly result = input<PaginatedResult<Product> | null>(null);
  readonly isLoading = input(false);
  readonly page = input.required<number>();
  readonly searchChanged = output<string>();
  readonly pageChanged = output<number>();
  readonly productAdded = output<Product>();

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  protected previousPage(): void {
    this.pageChanged.emit(Math.max(1, this.page() - 1));
  }

  protected nextPage(): void {
    const lastPage = this.result()?.lastPage ?? 0;
    if (this.page() < lastPage) this.pageChanged.emit(this.page() + 1);
  }

  protected productLabel(product: Product): string {
    const attributes = product.productAttributes
      .map((attribute) => `${attribute.attributeName}: ${attribute.attributeValue}`)
      .join(', ');
    return attributes ? `${product.baseProductName} · ${attributes}` : product.baseProductName;
  }
}
