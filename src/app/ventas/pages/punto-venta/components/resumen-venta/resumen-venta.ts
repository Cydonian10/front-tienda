import { Dialog } from '@angular/cdk/dialog';
import { Component, inject, Injector } from '@angular/core';
import { CarritoVentaService, solesCentavos } from '../../service/carrito-venta.service';
import { CobroDialog } from '../cobro-dialog/cobro-dialog';

let siguienteDialogo = 0;

@Component({
  selector: 'app-resumen-venta',
  templateUrl: './resumen-venta.html',
})
export class ResumenVenta {
  private readonly dialog = inject(Dialog);
  private readonly injector = inject(Injector);
  readonly carrito = inject(CarritoVentaService);
  readonly soles = solesCentavos;

  abrirCobro(): void {
    if (this.carrito.lineas().length === 0) return;
    const id = `cobro-venta-${siguienteDialogo++}`;
    this.dialog.open(CobroDialog, {
      id,
      injector: this.injector,
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      ariaModal: true,
      ariaLabelledBy: `${id}-title`,
      ariaDescribedBy: `${id}-descripcion`,
      autoFocus: '[data-dialog-cancel]',
      restoreFocus: true,
      closeOnNavigation: false,
    });
  }
}
