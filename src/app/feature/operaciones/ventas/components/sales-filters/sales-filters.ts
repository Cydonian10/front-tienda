import { Component, input, output } from '@angular/core';

import { SaleStatus } from '../../../../../core/models/sale.model';

export interface SalesHistoryFilters {
  status: SaleStatus | '';
  cashOpeningId: string;
  sellerId: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'sales-filters',
  templateUrl: './sales-filters.html',
})
export class SalesFilters {
  readonly filters = input.required<SalesHistoryFilters>();
  readonly canFilterSeller = input(false);
  readonly filtersChanged = output<Partial<SalesHistoryFilters>>();
  readonly applyRequested = output<void>();
  readonly clearRequested = output<void>();

  protected update(key: keyof SalesHistoryFilters, event: Event): void {
    this.filtersChanged.emit({ [key]: (event.target as HTMLInputElement).value });
  }
}
