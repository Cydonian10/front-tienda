import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import type { VarianteCatalogo } from '../../../../../api/interfaces/ventas/catalogo.interface';
import { DialogShell } from '../../../../../shared/components/dialog-shell/dialog-shell';
import { decimalCompacto } from '../../../../../shared/formatters/decimal';
import {
  CarritoVentaService,
  solesCentavos,
  textoEscalado,
} from '../../service/carrito-venta.service';

@Component({
  selector: 'app-agregar-producto-dialog',
  imports: [DialogShell],
  templateUrl: './agregar-producto-dialog.html',
  host: { class: 'block min-w-0' },
})
export class AgregarProductoDialog {
  readonly variante = inject<VarianteCatalogo>(DIALOG_DATA);
  readonly dialogRef = inject(DialogRef);
  readonly carrito = inject(CarritoVentaService);
  readonly titleId = `${this.dialogRef.id}-title`;
  readonly formId = `${this.dialogRef.id}-form`;
  readonly unidadId = signal(this.variante.unidadBase.id);
  readonly cantidad = signal('1');
  readonly unidad = computed(() =>
    this.variante.unidades.find((item) => item.id === this.unidadId()),
  );
  readonly calculo = computed(() =>
    this.carrito.calcular(this.variante, this.unidad(), this.cantidad().trim()),
  );
  readonly soles = solesCentavos;
  readonly texto = textoEscalado;
  readonly decimalCompacto = decimalCompacto;

  agregar(event: Event): void {
    event.preventDefault();
    const unidad = this.unidad();
    if (unidad && this.carrito.agregar(this.variante, unidad, this.cantidad().trim()))
      this.dialogRef.close(true);
  }
}
