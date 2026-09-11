import { Component, input, output } from '@angular/core';

import { Sale, SaleStatus } from '../../../../../core/models/sale.model';

@Component({
  selector: 'sales-history-table',
  templateUrl: './sales-history-table.html',
})
export class SalesHistoryTable {
  readonly sales = input.required<Sale[]>();
  readonly currentPersonId = input<number | null>(null);
  readonly canManage = input(false);
  readonly editRequested = output<Sale>();
  readonly payRequested = output<Sale>();
  readonly detailRequested = output<Sale>();
  readonly cancelRequested = output<Sale>();

  protected statusLabel(status: SaleStatus): string {
    return { PENDING: 'Pendiente', PAID: 'Pagada', CANCELLED: 'Cancelada' }[status];
  }

  protected canCancel(sale: Sale): boolean {
    return (
      sale.status !== 'CANCELLED' && (this.canManage() || sale.sellerId === this.currentPersonId())
    );
  }
}
