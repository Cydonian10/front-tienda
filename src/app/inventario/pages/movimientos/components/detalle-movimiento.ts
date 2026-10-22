import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import type {
  FiltroVariantesMovimiento,
  TipoMovimiento,
  VarianteMovimiento,
} from '../../../../api/interfaces/inventario/movimiento.interface';
import { useVariantesMovimiento } from '../../../actions/use-movimientos-action';
import { Icon } from '../../../../shared/components/icon/icon';
import type { FilaMovimiento } from '../movimiento-form.model';

const PAGE_LIMIT = 20;
const FACTOR_SCALE = 100_000_000n;
const QUANTITY_SCALE = 1_000_000n;

export function equivalenciaBase(cantidad: string, factor: string): string | null {
  const value = /^(-?)(0|[1-9]\d{0,13})(?:\.(\d{1,6}))?$/.exec(cantidad);
  const unit = /^(0|[1-9]\d{0,13})(?:\.(\d{1,8}))?$/.exec(factor);
  if (!value || !unit) return null;
  const amount = BigInt(value[2]) * QUANTITY_SCALE + BigInt((value[3] ?? '').padEnd(6, '0'));
  const multiplier = BigInt(unit[1]) * FACTOR_SCALE + BigInt((unit[2] ?? '').padEnd(8, '0'));
  const scaled = amount * multiplier;
  if (scaled % FACTOR_SCALE !== 0n) return null;
  const base = scaled / FACTOR_SCALE;
  const fraction = String(base % QUANTITY_SCALE).padStart(6, '0').replace(/0+$/, '');
  return `${value[1] && base !== 0n ? '-' : ''}${base / QUANTITY_SCALE}${fraction ? `.${fraction}` : ''}`;
}

@Component({
  selector: 'app-detalle-movimiento',
  imports: [Icon],
  templateUrl: './detalle-movimiento.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export class DetalleMovimiento {
  readonly fila = input.required<FilaMovimiento>();
  readonly indice = input.required<number>();
  readonly tipo = input.required<TipoMovimiento>();
  readonly origen = input.required<string>();
  readonly variantesSeleccionadas = input.required<readonly string[]>();
  readonly cambio = output<FilaMovimiento>();
  readonly quitar = output<void>();

  readonly busqueda = signal('');
  readonly pagina = signal(1);
  readonly abierto = signal(false);
  readonly indiceActivo = signal(-1);
  readonly opciones = signal<VarianteMovimiento[]>([]);
  readonly paginasTotales = signal(0);
  private readonly seleccion = signal<{ origen: string; item: VarianteMovimiento } | null>(null);
  readonly variante = computed(() => {
    const seleccion = this.seleccion();
    return seleccion?.origen === this.origen() && seleccion.item.variante.id === this.fila().varianteId
      ? seleccion.item
      : null;
  });
  readonly filtro = computed<FiltroVariantesMovimiento | null>(() => {
    const q = this.busqueda().trim();
    return this.origen() && q.length >= 2
      ? { tipo: this.tipo(), almacenId: this.origen(), q, page: this.pagina(), limit: PAGE_LIMIT }
      : null;
  });
  readonly consulta = useVariantesMovimiento(this.filtro);
  readonly unidad = computed(() => this.variante()?.unidades.find((item) => item.id === this.fila().unidadId));
  readonly base = computed(() => {
    const unidad = this.unidad();
    return unidad ? equivalenciaBase(this.fila().cantidad, unidad.factorABase) : null;
  });
  readonly puedeCargarMas = computed(() => this.pagina() < this.paginasTotales());

  constructor() {
    effect(() => {
      const filtro = this.filtro();
      const response = this.consulta.data();
      if (!filtro || !response || response.meta.page !== filtro.page) return;
      this.paginasTotales.set(response.meta.totalPages);
      this.opciones.update((items) => filtro.page === 1
        ? response.data
        : [...items, ...response.data.filter((item) => !items.some((old) => old.variante.id === item.variante.id))]);
    });
    effect(() => {
      this.origen();
      this.tipo();
      this.busqueda.set('');
      this.pagina.set(1);
      this.opciones.set([]);
      this.paginasTotales.set(0);
      this.abierto.set(false);
      this.indiceActivo.set(-1);
    });
  }

  buscar(value: string): void {
    this.busqueda.set(value);
    this.pagina.set(1);
    this.opciones.set([]);
    this.paginasTotales.set(0);
    this.abierto.set(true);
    this.indiceActivo.set(-1);
  }

  disponible(item: VarianteMovimiento): boolean {
    if (this.variantesSeleccionadas().includes(item.variante.id)) return false;
    if (this.tipo() === 'salida') return true;
    if (this.tipo() === 'traslado') return item.producto.activo && item.variante.activo;
    return (item.producto.activo && item.variante.activo) || this.fila().cantidad.trim().startsWith('-');
  }

  elegir(item: VarianteMovimiento): void {
    if (!this.disponible(item)) return;
    this.seleccion.set({ origen: this.origen(), item });
    this.cambio.emit({
      ...this.fila(),
      varianteId: item.variante.id,
      unidadId: item.unidades[0]?.id ?? '',
      costoUnitarioBase: '',
    });
    this.busqueda.set('');
    this.opciones.set([]);
    this.abierto.set(false);
  }

  actualizar(campo: 'cantidad' | 'unidadId' | 'costoUnitarioBase', valor: string): void {
    this.cambio.emit({
      ...this.fila(),
      [campo]: valor,
      ...(campo === 'cantidad' && valor.trim().startsWith('-') ? { costoUnitarioBase: '' } : {}),
    });
  }

  cargarMas(): void {
    if (this.puedeCargarMas() && !this.consulta.isFetching()) this.pagina.update((value) => value + 1);
  }

  tecla(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.abierto.set(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.abierto.set(true);
      const length = this.opciones().length;
      if (!length) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      for (let step = 1; step <= length; step++) {
        const index = this.indiceActivo() < 0
          ? (direction === 1 ? step - 1 : length - step)
          : (this.indiceActivo() + direction * step + length * 2) % length;
        if (this.disponible(this.opciones()[index])) {
          this.indiceActivo.set(index);
          break;
        }
      }
    } else if (event.key === 'Enter' && this.abierto() && this.indiceActivo() >= 0) {
      event.preventDefault();
      this.elegir(this.opciones()[this.indiceActivo()]);
    }
  }
}
