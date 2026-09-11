import { DIALOG_DATA, Dialog, DialogRef } from '@angular/cdk/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, requiredError, validate } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';

import { SalesService } from '../../../../core/api/sales.service';
import { PaymentMethod } from '../../../../core/models/payment-method.model';
import { Sale } from '../../../../core/models/sale.model';

export interface SalePaymentDialogData {
  sale: Sale;
  paymentMethods: PaymentMethod[];
}

interface SalePaymentFormModel {
  paymentMethodId: string;
  amount: number;
}

@Component({
  selector: 'sale-payment-dialog',
  imports: [FormField, FormRoot],
  templateUrl: './sale-payment-dialog.html',
})
export class SalePaymentDialog {
  private readonly dialogRef = inject(DialogRef<Sale | undefined>);
  protected readonly data = inject<SalePaymentDialogData>(DIALOG_DATA);
  private readonly salesService = inject(SalesService);
  protected readonly error = signal<string | null>(null);
  protected readonly model = signal<SalePaymentFormModel>({
    paymentMethodId: String(this.data.paymentMethods[0]?.id ?? ''),
    amount: this.data.sale.totalAmount,
  });
  protected readonly form = form(
    this.model,
    (path) => {
      validate(path.paymentMethodId, ({ value }) =>
        Number(value()) > 0
          ? undefined
          : requiredError({ message: 'Selecciona un método de pago.' }),
      );
      validate(path.amount, ({ value }) =>
        Number.isFinite(value()) &&
        Math.round(value() * 100) === Math.round(this.data.sale.totalAmount * 100)
          ? undefined
          : requiredError({ message: 'El importe debe coincidir exactamente con el total.' }),
      );
    },
    {
      submission: {
        action: async (field) => {
          this.error.set(null);
          const { paymentMethodId, amount } = field().value();
          try {
            const sale = await firstValueFrom(
              this.salesService.pay(this.data.sale.id, {
                paymentMethodId: Number(paymentMethodId),
                amount,
              }),
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
  protected readonly paymentMethodError = computed(() => {
    const field = this.form.paymentMethodId();
    return field.touched() && field.invalid() ? 'Selecciona un método de pago.' : null;
  });
  protected readonly amountError = computed(() => {
    const field = this.form.amount();
    return field.touched() && field.invalid()
      ? 'El importe debe coincidir exactamente con el total.'
      : null;
  });

  protected close(): void {
    this.dialogRef.close();
  }

  private message(error: unknown): string {
    const body =
      error instanceof HttpErrorResponse ? (error.error as { message?: string | string[] }) : null;
    return Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? 'No se pudo cobrar la venta');
  }
}

export function openSalePaymentDialog(
  dialog: Dialog,
  data: SalePaymentDialogData,
): DialogRef<Sale | undefined, SalePaymentDialog> {
  return dialog.open(SalePaymentDialog, { data, width: '28rem', disableClose: true });
}
