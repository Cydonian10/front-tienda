import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { CashRegisterOpening } from '../../../../core/models/cash-register.model';
import { BusinessDatePipe } from '../../../../shared/pipes/business-date.pipe';

@Component({
  selector: 'cash-session-detail-dialog',
  imports: [BusinessDatePipe, DecimalPipe],
  templateUrl: './cash-session-detail-dialog.html',
})
export class CashSessionDetailDialog {
  private readonly dialogRef = inject(DialogRef<void>);
  protected readonly opening = inject<CashRegisterOpening>(DIALOG_DATA);

  protected close(): void {
    this.dialogRef.close();
  }
}

export function openCashSessionDetailDialog(
  dialog: Dialog,
  opening: CashRegisterOpening,
): DialogRef<void, CashSessionDetailDialog> {
  return dialog.open(CashSessionDetailDialog, { data: opening, width: '42rem' });
}
