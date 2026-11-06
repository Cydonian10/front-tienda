import { Component, computed, inject, signal } from '@angular/core';
import { CarritoVentaService, solesCentavos } from '../../service/carrito-venta.service';

@Component({
  selector: 'app-resumen-venta',
  templateUrl: './resumen-venta.html',
})
export class ResumenVenta {
  readonly carrito = inject(CarritoVentaService);
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

  abrirCobro(dialogo: HTMLDialogElement): void {
    if (this.carrito.lineas().length === 0) return;
    this.seleccionarMedio('efectivo');
    dialogo.showModal();
  }

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
