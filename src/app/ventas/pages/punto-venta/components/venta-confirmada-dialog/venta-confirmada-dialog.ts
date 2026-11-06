import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, inject } from '@angular/core';
import type { VentaCreada } from '../../../../../api/interfaces/ventas/venta.interface';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { solesCentavos } from '../../service/carrito-venta.service';

@Component({
  selector: 'app-venta-confirmada-dialog',
  imports: [DialogShell],
  templateUrl: './venta-confirmada-dialog.html',
  host: { class: 'block min-w-0' },
})
export class VentaConfirmadaDialog {
  readonly dialogRef = inject(DialogRef);
  readonly venta = inject<VentaCreada>(DIALOG_DATA);
  readonly titleId = `${this.dialogRef.id}-title`;

  formato(valor: string): string {
    const [entero, decimal = ''] = valor.split('.');
    return solesCentavos(BigInt(entero) * 100n + BigInt(decimal.padEnd(2, '0')));
  }
}
