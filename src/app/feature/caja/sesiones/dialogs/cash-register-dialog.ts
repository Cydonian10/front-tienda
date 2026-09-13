import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { CashRegistersService } from '../../../../core/api/cash-registers.service';
import { CashRegister } from '../../../../core/models/cash-register.model';

const requiredTrimmed: ValidatorFn = (control) =>
  typeof control.value === 'string' && control.value.trim() ? null : { required: true };
export interface CashRegisterDialogData {
  register?: CashRegister | null;
}
@Component({
  selector: 'cash-register-dialog',
  imports: [ReactiveFormsModule],
  templateUrl: './cash-register-dialog.html',
})
export class CashRegisterDialog {
  private readonly dialogRef = inject(DialogRef<CashRegister | undefined>);
  private readonly data = inject<CashRegisterDialogData | null>(DIALOG_DATA, { optional: true });
  private readonly service = inject(CashRegistersService);
  private readonly formBuilder = inject(FormBuilder);
  protected readonly register = this.data?.register ?? null;
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = this.formBuilder.nonNullable.group({
    code: [this.register?.code ?? '', requiredTrimmed],
    name: [this.register?.name ?? '', requiredTrimmed],
    active: [this.register?.active ?? true],
  });
  protected async submit(): Promise<void> {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    if (this.register?.openOpening && !value.active) {
      this.error.set('No se puede desactivar una caja con una sesión abierta');
      return;
    }
    this.isSubmitting.set(true);
    this.error.set(null);
    try {
      const register = this.register
        ? await firstValueFrom(
            this.service.update(this.register.id, {
              code: value.code.trim(),
              name: value.name.trim(),
              active: value.active,
            }),
          )
        : await firstValueFrom(
            this.service.create({ code: value.code.trim(), name: value.name.trim() }),
          );
      this.dialogRef.close(register);
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
export function openCashRegisterDialog(
  dialog: Dialog,
  register?: CashRegister | null,
): DialogRef<CashRegister | undefined, CashRegisterDialog> {
  return dialog.open(CashRegisterDialog, {
    data: { register: register ?? null },
    width: '28rem',
    disableClose: true,
  });
}
