import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { CashMovementsService } from '../../../../core/api/cash-movements.service';
import {
  CashMovement,
  CashMovementType,
  CreateCashMovement,
} from '../../../../core/models/cash-movement.model';
import { CashRegisterOpening } from '../../../../core/models/cash-register.model';

@Component({
  selector: 'cash-movement-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './cash-movement-dialog.html',
})
export class CashMovementDialog {
  private readonly dialogRef = inject(DialogRef<CashMovement | undefined>);
  protected readonly opening = inject<CashRegisterOpening>(DIALOG_DATA);
  private readonly service = inject(CashMovementsService);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isConflict = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    type: this.formBuilder.nonNullable.control<CashMovementType>('income'),
    amount: [0, [Validators.required, Validators.min(0.01)]],
    reason: ['', [Validators.required, Validators.maxLength(255)]],
  });

  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const reason = value.reason.trim();
    if (!reason) {
      this.form.controls.reason.setErrors({ required: true });
      return;
    }
    const dto: CreateCashMovement = {
      cashOpeningId: this.opening.id,
      type: value.type,
      amount: value.amount,
      reason,
    };
    this.isSubmitting.set(true);
    this.error.set(null);
    this.isConflict.set(false);
    try {
      this.dialogRef.close(await firstValueFrom(this.service.create(dto)));
    } catch (error) {
      this.isConflict.set(error instanceof HttpErrorResponse && error.status === 409);
      this.error.set(this.message(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  protected close(): void {
    this.dialogRef.close();
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'No se pudo registrar el movimiento');
  }
}

export function openCashMovementDialog(
  dialog: Dialog,
  opening: CashRegisterOpening,
): DialogRef<CashMovement | undefined, CashMovementDialog> {
  return dialog.open(CashMovementDialog, { data: opening, width: '28rem', disableClose: true });
}
