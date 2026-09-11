import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  form,
  maxLength,
  required,
  requiredError,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { SalesService } from '../../../../core/api/sales.service';
import { Sale } from '../../../../core/models/sale.model';

export interface SaleCancellationDialogData {
  sale: Sale;
}

interface SaleCancellationFormModel {
  cancellationReason: string;
}

@Component({
  selector: 'sale-cancellation-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './sale-cancellation-dialog.html',
})
export class SaleCancellationDialog {
  private readonly dialogRef = inject(DialogRef<Sale | undefined>);
  protected readonly data = inject<SaleCancellationDialogData>(DIALOG_DATA);
  private readonly salesService = inject(SalesService);
  protected readonly error = signal<string | null>(null);
  protected readonly model = signal<SaleCancellationFormModel>({ cancellationReason: '' });
  protected readonly form = form(
    this.model,
    (path) => {
      required(path.cancellationReason, { message: 'El motivo es obligatorio.' });
      maxLength(path.cancellationReason, 500, {
        message: 'El motivo no puede superar 500 caracteres.',
      });
      validate(path.cancellationReason, ({ value }) =>
        value().trim() ? undefined : requiredError({ message: 'El motivo es obligatorio.' }),
      );
    },
    {
      submission: {
        action: async (field) => {
          this.error.set(null);
          const cancellationReason = field().value().cancellationReason.trim();
          try {
            const sale = await firstValueFrom(
              this.salesService.cancel(this.data.sale.id, { cancellationReason }),
            );
            this.dialogRef.close(sale);
            return undefined;
          } catch (error) {
            const message = this.message(error);
            this.error.set(message);
            return { kind: 'serverError', message };
          }
        },
      },
    },
  );
  protected readonly reasonError = computed(() => {
    const field = this.form.cancellationReason();
    if (!field.touched() || !field.invalid()) return null;
    return field.getError('maxLength')
      ? 'El motivo no puede superar 500 caracteres.'
      : 'El motivo es obligatorio.';
  });

  protected close(): void {
    this.dialogRef.close();
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'No se pudo cancelar la venta');
  }
}

export function openSaleCancellationDialog(
  dialog: Dialog,
  sale: Sale,
): DialogRef<Sale | undefined, SaleCancellationDialog> {
  return dialog.open(SaleCancellationDialog, {
    data: { sale },
    width: '30rem',
    disableClose: true,
  });
}
