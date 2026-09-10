import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CashRegisterOpeningsService } from '../../../../core/api/cash-register-openings.service';
import {
  CashRegister,
  CashRegisterOpening,
  CashResponsible,
  CreateCashRegisterOpening,
} from '../../../../core/models/cash-register.model';

export interface CashRegisterOpeningDialogData {
  register: CashRegister;
  isAdmin: boolean;
  currentPerson: CashResponsible;
  responsibles: CashResponsible[];
}
@Component({
  selector: 'cash-register-opening-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './cash-register-opening-dialog.html',
})
export class CashRegisterOpeningDialog {
  private readonly dialogRef = inject(DialogRef<CashRegisterOpening | undefined>);
  protected readonly data = inject<CashRegisterOpeningDialogData>(DIALOG_DATA);
  private readonly service = inject(CashRegisterOpeningsService);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.formBuilder.nonNullable.group({
    openingAmount: [0, [Validators.required, Validators.min(0)]],
    responsibleId: [this.data.currentPerson.id, this.data.isAdmin ? Validators.required : []],
  });
  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const dto: CreateCashRegisterOpening = {
      cashRegisterId: this.data.register.id,
      openingAmount: value.openingAmount,
      ...(this.data.isAdmin ? { responsibleId: value.responsibleId } : {}),
    };
    this.isSubmitting.set(true);
    this.error.set(null);
    try {
      this.dialogRef.close(await firstValueFrom(this.service.create(dto)));
    } catch (error) {
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
      : (body?.message ?? 'Error inesperado');
  }
}
export function openCashRegisterOpeningDialog(
  dialog: Dialog,
  data: CashRegisterOpeningDialogData,
): DialogRef<CashRegisterOpening | undefined, CashRegisterOpeningDialog> {
  return dialog.open(CashRegisterOpeningDialog, { data, width: '28rem', disableClose: true });
}
