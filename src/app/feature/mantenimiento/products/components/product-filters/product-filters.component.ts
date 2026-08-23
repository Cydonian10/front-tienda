import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icon } from '../../../../../shared/icon/icon';

@Component({
  selector: 'product-filters',
  imports: [Icon, RouterLink],
  templateUrl: './product-filters.component.html',
  host: {
    class: 'block',
  },
})
export class ProductFilters {
  readonly searchChanged = output<string>();
  readonly minPriceChanged = output<string>();
  readonly maxPriceChanged = output<string>();
  readonly minStockChanged = output<string>();

  protected onSearch(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  protected onMinPrice(event: Event): void {
    this.minPriceChanged.emit((event.target as HTMLInputElement).value);
  }

  protected onMaxPrice(event: Event): void {
    this.maxPriceChanged.emit((event.target as HTMLInputElement).value);
  }

  protected onMinStock(event: Event): void {
    this.minStockChanged.emit((event.target as HTMLInputElement).value);
  }
}
