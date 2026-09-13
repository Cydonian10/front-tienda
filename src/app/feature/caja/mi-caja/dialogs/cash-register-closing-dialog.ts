import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { CashRegisterOpeningsService } from '../../../../core/api/cash-register-openings.service';
import {
  CashRegisterOpening,
  CloseCashRegisterOpening,
} from '../../../../core/models/cash-register.model';
import { PaymentMethod } from '../../../../core/models/payment-method.model';

export interface CashRegisterClosingDialogData {
  opening: CashRegisterOpening;
  paymentMethods: PaymentMethod[];
}

@Component({
  selector: 'cash-register-closing-dialog',
  imports: [DecimalPipe, ReactiveFormsModule],
  templateUrl: './cash-register-closing-dialog.html',
})
export class CashRegisterClosingDialog {
  private readonly dialogRef = inject(DialogRef<CashRegisterOpening | undefined>);
  protected readonly data = inject<CashRegisterClosingDialogData>(DIALOG_DATA);
  private readonly service = inject(CashRegisterOpeningsService);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isConflict = signal(false);
  protected readonly closedOpening = signal<CashRegisterOpening | null>(null);
  protected readonly form = this.formBuilder.nonNullable.group({
    details: this.formBuilder.array(
      this.data.paymentMethods.map((method) =>
        this.formBuilder.nonNullable.group({
          paymentMethodId: [method.id],
          realAmount: [0, [Validators.required, Validators.min(0)]],
        }),
      ),
    ),
  });

  protected get details(): FormArray {
    return this.form.controls.details;
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid || this.closedOpening()) return;
    const dto: CloseCashRegisterOpening = { details: this.form.getRawValue().details };
    this.isSubmitting.set(true);
    this.error.set(null);
    this.isConflict.set(false);
    try {
      this.closedOpening.set(await firstValueFrom(this.service.close(this.data.opening.id, dto)));
    } catch (error) {
      this.isConflict.set(error instanceof HttpErrorResponse && error.status === 409);
      this.error.set(this.message(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected finish(): void {
    const opening = this.closedOpening();
    if (opening) this.dialogRef.close(opening);
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'No se pudo cerrar la sesión');
  }
}

export function openCashRegisterClosingDialog(
  dialog: Dialog,
  data: CashRegisterClosingDialogData,
): DialogRef<CashRegisterOpening | undefined, CashRegisterClosingDialog> {
  return dialog.open(CashRegisterClosingDialog, { data, width: '36rem', disableClose: true });
}
