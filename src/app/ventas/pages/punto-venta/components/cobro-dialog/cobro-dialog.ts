import { DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { CarritoVentaService, solesCentavos } from '../../service/carrito-venta.service';

@Component({
  selector: 'app-cobro-dialog',
  imports: [DialogShell],
  templateUrl: './cobro-dialog.html',
  host: { class: 'block min-w-0' },
})
export class CobroDialog {
  readonly dialogRef = inject(DialogRef);
  readonly carrito = inject(CarritoVentaService);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly descripcionId = `${this.dialogRef.id}-descripcion`;
  readonly montoId = `${this.dialogRef.id}-monto`;
  readonly errorMontoId = `${this.dialogRef.id}-monto-error`;
  readonly medioPagoId = `${this.dialogRef.id}-medio-pago`;
  readonly soles = solesCentavos;
  readonly medioPago = signal<'efectivo' | 'yape'>('efectivo');
  readonly monto = signal('');

  readonly montoCentavos = computed(() => {
    const partes = /^(\d{1,16})(?:\.(\d{1,2}))?$/.exec(this.monto().trim());
    return partes ? BigInt(partes[1]) * 100n + BigInt((partes[2] ?? '').padEnd(2, '0')) : null;
  });
  readonly errorMonto = computed(() => {
    const monto = this.montoCentavos();
    if (monto === null) return 'Ingresa un monto válido con hasta dos decimales.';
    if (this.medioPago() === 'yape' && monto !== this.carrito.total())
      return 'El monto de Yape debe ser igual al total.';
    if (this.medioPago() === 'efectivo' && monto < this.carrito.total())
      return 'El monto recibido debe cubrir el total.';
    return '';
  });
  readonly vuelto = computed(() => {
    const monto = this.montoCentavos();
    return monto !== null && monto >= this.carrito.total() ? monto - this.carrito.total() : null;
  });

  seleccionarMedio(medio: 'efectivo' | 'yape'): void {
    this.medioPago.set(medio);
    if (medio === 'yape') this.usarMontoExacto();
    else this.monto.set('');
  }

  usarMontoExacto(): void {
    const total = this.carrito.total();
    this.monto.set(`${total / 100n}.${String(total % 100n).padStart(2, '0')}`);
  }
}
