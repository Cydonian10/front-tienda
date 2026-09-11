import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

import { Sale } from '../../../../core/models/sale.model';

export interface SaleDetailDialogData {
  sale: Sale;
}

@Component({
  selector: 'sale-detail-dialog',
  templateUrl: './sale-detail-dialog.html',
})
export class SaleDetailDialog {
  private readonly dialogRef = inject(DialogRef<void>);
  protected readonly data = inject<SaleDetailDialogData>(DIALOG_DATA);

  protected close(): void {
    this.dialogRef.close();
  }
}

export function openSaleDetailDialog(
  dialog: Dialog,
  sale: Sale,
): DialogRef<void, SaleDetailDialog> {
  return dialog.open(SaleDetailDialog, { data: { sale }, width: '48rem' });
}
