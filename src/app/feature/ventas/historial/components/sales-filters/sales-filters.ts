import { Component, input, output } from '@angular/core';

import { SaleStatus } from '../../../../../core/models/sale.model';
import { Person } from '../../../../../core/models/people.model';

export interface SalesHistoryFilters {
  status: SaleStatus | '';
  sellerId: string;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'sales-filters',
  templateUrl: './sales-filters.html',
  host: {
    class: 'block',
  },
})
export class SalesFilters {
  readonly filters = input.required<SalesHistoryFilters>();
  readonly canFilterSeller = input(false);
  readonly sellers = input<Person[]>([]);
  readonly filtersChanged = output<Partial<SalesHistoryFilters>>();
  readonly applyRequested = output<void>();
  readonly clearRequested = output<void>();

  protected update(key: keyof SalesHistoryFilters, event: Event): void {
    this.filtersChanged.emit({ [key]: (event.target as HTMLInputElement).value });
  }
}
