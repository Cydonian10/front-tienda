import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';

export type ConfirmDialogTone = 'default' | 'danger';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmDialogTone;
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  host: { class: 'block min-w-0' },
})
export class ConfirmDialog {
  readonly data = inject<ConfirmDialogOptions>(DIALOG_DATA);
  readonly dialogRef = inject<DialogRef<boolean>>(DialogRef);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly messageId = `${this.dialogRef.id}-message`;
}
