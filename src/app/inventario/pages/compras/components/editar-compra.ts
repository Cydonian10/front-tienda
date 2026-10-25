import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { PERMISSION_CODES } from '../../../../api/interfaces/access-control/permision.interface';
import type {
  CompraResponse,
  CorreccionCompra,
} from '../../../../api/interfaces/inventario/compra.interface';
import { AuthorizationService } from '../../../../auth/services/authorization.service';
import { useEditarCompra } from '../../../actions/use-compras-action';
import { formatTotalPEN, formatScaled } from '../compra-form.model';

const decimal = /^(0|[1-9]\d{0,13})(?:\.(\d{1,6}))?$/;

function scaled(value: string): bigint | null {
  const match = decimal.exec(value);
  return match ? BigInt(match[1]) * 1_000_000n + BigInt((match[2] ?? '').padEnd(6, '0')) : null;
}

@Component({
  selector: 'app-editar-compra',
  templateUrl: './editar-compra.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class EditarCompra implements OnInit {
  @Input({ required: true }) compra!: CompraResponse;
  readonly cancel = output<void>();
  readonly saved = output<void>();
  readonly reload = output<void>();
  private readonly authorization = inject(AuthorizationService);
  readonly mutation = useEditarCompra();
  readonly tipo = signal<'factura' | 'boleta' | 'otro'>('factura');
  readonly fecha = signal('');
  readonly serie = signal('');
  readonly numero = signal('');
  readonly observaciones = signal('');
  readonly precios = signal<Record<string, string>>({});
  readonly submitted = signal(false);
  readonly error = signal('');
  readonly saving = signal(false);
  readonly money = formatTotalPEN;

  ngOnInit(): void {
    this.tipo.set(this.compra.tipoDocumento ?? 'factura');
    this.fecha.set(this.compra.fecha);
    this.serie.set(this.compra.serieDocumento ?? '');
    this.numero.set(this.compra.numeroDocumento ?? '');
    this.observaciones.set(this.compra.observaciones ?? '');
    this.precios.set(
      Object.fromEntries(this.compra.renglones.map((row) => [row.id, row.precioUnitario])),
    );
  }

  readonly total = computed(() => {
    if (!this.compra.renglones.length) return this.compra.totalDocumento;
    let amount = 0n;
    for (const row of this.compra.renglones) {
      const quantity = scaled(row.cantidad);
      const price = scaled(this.precios()[row.id] ?? '');
      if (quantity === null || price === null) return null;
      amount += (quantity * price + 500_000n) / 1_000_000n;
    }
    return formatScaled(amount);
  });

  readonly dateValid = computed(() => {
    const date = this.fecha();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === date;
  });

  priceValid(id: string): boolean {
    return scaled(this.precios()[id] ?? '') !== null;
  }

  readonly valid = computed(() => {
    return (
      this.dateValid() &&
      !!this.serie().trim() &&
      this.serie().trim().length <= 100 &&
      !!this.numero().trim() &&
      this.numero().trim().length <= 100 &&
      this.observaciones().trim().length <= 5000 &&
      (!this.compra.renglones.length || this.total() !== null)
    );
  });

  readonly changed = computed(
    () =>
      this.tipo() !== this.compra.tipoDocumento ||
      this.fecha() !== this.compra.fecha ||
      this.serie().trim() !== this.compra.serieDocumento ||
      this.numero().trim() !== this.compra.numeroDocumento ||
      this.observaciones().trim() !== (this.compra.observaciones ?? '') ||
      this.compra.renglones.some((row) => this.precios()[row.id] !== row.precioUnitario),
  );

  setPrice(id: string, value: string): void {
    this.precios.update((prices) => ({ ...prices, [id]: value }));
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    if (!this.valid() || !this.changed()) return;
    if (!this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.COMPRAS_UPDATE)) {
      this.error.set('No tienes permiso para editar compras.');
      return;
    }
    const correccion: CorreccionCompra = {
      revision: this.compra.revision,
      tipoDocumento: this.tipo(),
      fecha: this.fecha(),
      serieDocumento: this.serie().trim(),
      numeroDocumento: this.numero().trim(),
      observaciones: this.observaciones().trim(),
      precios: this.compra.renglones.map((row) => ({
        renglonId: row.id,
        precioUnitario: this.precios()[row.id],
      })),
    };
    this.error.set('');
    this.saving.set(true);
    try {
      await this.mutation.mutateAsync({ id: this.compra.id, correccion });
      this.saved.emit();
    } catch (cause) {
      this.error.set(
        cause instanceof HttpErrorResponse && cause.status === 409
          ? typeof cause.error?.message === 'string'
            ? cause.error.message
            : 'La compra cambió o el costo no se puede corregir. Actualiza el detalle e inténtalo de nuevo.'
          : 'No se pudo guardar la corrección. Actualiza el detalle antes de volver a intentarlo.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
