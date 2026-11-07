import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { DOCUMENT } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { PERMISSION_CODES } from '../../../../../api/interfaces/access-control/permision.interface';
import type { VentaCreada } from '../../../../../api/interfaces/ventas/venta.interface';
import { VentaApi } from '../../../../../api/ventas/venta/venta-api';
import { usePermissions } from '../../../../../auth/services/use-permissions';
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
  private readonly api = inject(VentaApi);
  private readonly document = inject(DOCUMENT);
  private readonly permisos = usePermissions('VENTAS', {
    imprimir: PERMISSION_CODES.CAJAS_TURNOS_READ,
  });
  readonly puedeImprimir = this.permisos.imprimir;
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly imprimiendo = signal(false);
  readonly errorImpresion = signal('');
  readonly ticket = injectQuery(() => ({
    queryKey: ['ventas', 'ticket', this.venta.id],
    queryFn: () => this.api.ticket(this.venta.id),
    retry: false,
  }));

  async imprimir(): Promise<void> {
    if (this.imprimiendo() || !this.permisos.imprimir() || !this.ticket.data()) return;
    this.errorImpresion.set('');
    const ventana = this.document.defaultView?.open('', '_blank');
    if (!ventana) {
      this.errorImpresion.set(
        'Permite ventanas emergentes para abrir el ticket e inténtalo de nuevo.',
      );
      return;
    }
    ventana.opener = null;
    this.imprimiendo.set(true);
    try {
      const pdf = await this.api.ticketPdf(this.venta.id);
      const url = URL.createObjectURL(pdf);
      ventana.location.href = url;
      // El visor necesita conservar el blob después de abrirse.
      this.document.defaultView?.setTimeout(() => URL.revokeObjectURL(url), 300_000);
    } catch {
      ventana.close();
      this.errorImpresion.set(
        'No se pudo abrir el PDF. La venta ya está registrada; vuelve a intentar imprimir.',
      );
    } finally {
      this.imprimiendo.set(false);
    }
  }

  cantidad(valor: string): string {
    return valor.includes('.') ? valor.replace(/0+$/, '').replace(/\.$/, '') : valor;
  }

  tieneImporte(valor: string): boolean {
    return /[1-9]/.test(valor);
  }

  fecha(valor: string): string {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Lima',
    }).format(new Date(valor));
  }

  formato(valor: string): string {
    const [entero, decimal = ''] = valor.split('.');
    return solesCentavos(BigInt(entero) * 100n + BigInt(decimal.padEnd(2, '0')));
  }
}
