import { Component, input, output } from '@angular/core';

import { Sale, SaleStatus } from '../../../../../core/models/sale.model';

@Component({
  selector: 'sales-history-table',
  templateUrl: './sales-history-table.html',
  host: {
    class: 'block',
  },
})
export class SalesHistoryTable {
  readonly sales = input.required<Sale[]>();
  readonly currentPersonId = input<number | null>(null);
  readonly canCancelPaid = input(false);
  readonly canCancelAnyPending = input(false);
  readonly editRequested = output<Sale>();
  readonly payRequested = output<Sale>();
  readonly detailRequested = output<Sale>();
  readonly cancelRequested = output<Sale>();

  protected statusLabel(status: SaleStatus): string {
    return { PENDING: 'Pendiente', PAID: 'Pagada', CANCELLED: 'Cancelada' }[status];
  }

  protected canCancel(sale: Sale): boolean {
    if (sale.status === 'CANCELLED') return false;
    if (sale.status === 'PAID') return this.canCancelPaid();
    return this.canCancelAnyPending() || sale.sellerId === this.currentPersonId();
  }
}
