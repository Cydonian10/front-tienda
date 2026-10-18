import { ChangeDetectionStrategy, Component, computed, output, signal } from '@angular/core';
import type { Almacen } from '../../../../api/interfaces/inventario/almacen.interface';
import type {
  ProveedorResponse,
  VarianteCompraResponse,
} from '../../../../api/interfaces/inventario/compra.interface';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import {
  useAlmacenesCompra,
  useProveedoresCompra,
  useVariantesCompra,
} from '../../../actions/use-compras-action';
import {
  formatTotalPEN,
  renglonCalculo,
  totalVistaPrevia,
  type RenglonFormulario,
} from '../compra-form.model';

function todayLocal(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

@Component({
  selector: 'app-compra-form',
  imports: [Pagination],
  templateUrl: './compra-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class CompraForm {
  readonly cancel = output<void>();
  readonly proveedor = signal<ProveedorResponse | null>(null);
  readonly almacen = signal<Almacen | null>(null);
  readonly tipoDocumento = signal<'factura' | 'boleta' | 'otro' | ''>('factura');
  readonly fecha = signal(todayLocal());
  readonly serieDocumento = signal('');
  readonly numeroDocumento = signal('');
  readonly observaciones = signal('');
  private nextRowKey = 1;
  readonly renglones = signal<RenglonFormulario[]>([this.blankRow()]);

  readonly proveedorPage = signal(1);
  readonly proveedorLimit = signal(10);
  readonly proveedorSearchDraft = signal('');
  readonly proveedorSearch = signal('');
  readonly proveedorFilter = signal<'nombre' | 'documento'>('nombre');
  private readonly proveedorNombre = computed(() =>
    this.proveedorFilter() === 'nombre' ? this.proveedorSearch() : '',
  );
  private readonly proveedorDocumento = computed(() =>
    this.proveedorFilter() === 'documento' ? this.proveedorSearch() : '',
  );
  readonly proveedoresQuery = useProveedoresCompra(
    this.proveedorPage,
    this.proveedorLimit,
    this.proveedorNombre,
    this.proveedorDocumento,
  );
  readonly proveedores = computed(() => {
    const items = this.proveedoresQuery.data()?.data ?? [];
    const selected = this.proveedor();
    return selected && !items.some((item) => item.id === selected.id)
      ? [selected, ...items]
      : items;
  });

  readonly almacenPage = signal(1);
  readonly almacenesQuery = useAlmacenesCompra(this.almacenPage);
  readonly almacenes = computed(() => {
    const items = this.almacenesQuery.data()?.data ?? [];
    const selected = this.almacen();
    return selected && !items.some((item) => item.id === selected.id)
      ? [selected, ...items]
      : items;
  });

  readonly variantePage = signal(1);
  readonly varianteLimit = signal(10);
  readonly varianteSearchDraft = signal('');
  readonly varianteSearch = signal('');
  readonly variantesQuery = useVariantesCompra(
    this.variantePage,
    this.varianteLimit,
    this.varianteSearch,
  );
  readonly variantes = computed(() => this.variantesQuery.data()?.data ?? []);
  readonly total = computed(() => totalVistaPrevia(this.renglones()));
  readonly validDate = computed(() => validDate(this.fecha()));
  readonly canConfirm = computed(
    () =>
      !!this.proveedor() &&
      !!this.almacen()?.activo &&
      !!this.tipoDocumento() &&
      this.validDate() &&
      !!this.serieDocumento().trim() &&
      this.serieDocumento().trim().length <= 100 &&
      !!this.numeroDocumento().trim() &&
      this.numeroDocumento().trim().length <= 100 &&
      this.total() !== null,
  );
  readonly money = formatTotalPEN;
  readonly calculate = renglonCalculo;

  private blankRow(): RenglonFormulario {
    return {
      key: this.nextRowKey++,
      variante: null,
      unidadId: '',
      cantidad: '',
      precioUnitario: '',
    };
  }

  addRow(): void {
    this.renglones.update((rows) => [...rows, this.blankRow()]);
  }
  removeRow(key: number): void {
    this.renglones.update((rows) => rows.filter((row) => row.key !== key));
  }
  updateRow(key: number, changes: Partial<RenglonFormulario>): void {
    this.renglones.update((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...changes } : row)),
    );
  }
  selectVariant(key: number, id: string): void {
    const variant =
      this.variantes().find((item) => item.id === id) ??
      this.renglones().find((item) => item.key === key)?.variante;
    this.updateRow(key, {
      variante: variant?.id === id ? variant : null,
      unidadId: variant?.id === id ? variant.unidadBase.id : '',
    });
  }
  rowOptions(row: RenglonFormulario): VarianteCompraResponse[] {
    const items = this.variantes();
    return row.variante && !items.some((item) => item.id === row.variante?.id)
      ? [row.variante, ...items]
      : items;
  }
  selectProveedor(id: string): void {
    this.proveedor.set(this.proveedores().find((item) => item.id === id) ?? null);
  }
  selectAlmacen(id: string): void {
    this.almacen.set(this.almacenes().find((item) => item.id === id) ?? null);
  }
  searchProviders(event: Event): void {
    event.preventDefault();
    this.proveedorPage.set(1);
    this.proveedorSearch.set(this.proveedorSearchDraft().trim().slice(0, 100));
  }
  changeProviderFilter(value: string): void {
    if (value !== 'nombre' && value !== 'documento') return;
    this.proveedorFilter.set(value);
    this.proveedorPage.set(1);
  }
  searchVariants(event: Event): void {
    event.preventDefault();
    this.variantePage.set(1);
    this.varianteSearch.set(this.varianteSearchDraft().trim().slice(0, 200));
  }
  changeProviderLimit(limit: number): void {
    this.proveedorPage.set(1);
    this.proveedorLimit.set(limit);
  }
  changeVariantLimit(limit: number): void {
    this.variantePage.set(1);
    this.varianteLimit.set(limit);
  }
}
