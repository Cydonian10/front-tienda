import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import type {
  ExistenciaItem,
  FiltroExistencias,
} from '../../../api/interfaces/inventario/existencia.interface';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { formatearSoles } from '../../../shared/formatters/decimal';
import { useAlmacenesExistencias, useExistencias } from '../../actions/use-existencias-action';
import { ExistenciaUnidad } from './components/existencia-unidad';
import { ExistenciaMinimo } from './components/existencia-minimo';
import { decimalCompacto } from './existencia-unidades.model';

/** Redondea a centavos sin pasar por aritmética binaria. */
export function soles(valor: string): string {
  return formatearSoles(valor);
}

export function promedio(valor: string | null): string {
  return valor === null ? '—' : soles(valor);
}

@Component({
  selector: 'app-existencias-page',
  imports: [EmptyState, Pagination, ExistenciaUnidad, ExistenciaMinimo],
  templateUrl: './existencias-page.html',
  host: { class: 'block min-w-0' },
})
export default class ExistenciasPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly almacenId = computed(() => this.params().get('almacenId') || null);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly q = computed(() => this.params().get('q') ?? '');
  readonly searchDraft = signal(this.route.snapshot.queryParamMap.get('q') ?? '');
  readonly disponibilidad = signal<FiltroExistencias['disponibilidad']>('todas');
  readonly unidadesElegidas = signal<Record<string, string>>({});
  readonly filtro = computed<FiltroExistencias | null>(() => {
    const almacenId = this.almacenId();
    return almacenId
      ? {
          almacenId,
          page: this.page(),
          limit: this.pageSize(),
          q: this.q(),
          disponibilidad: this.disponibilidad(),
        }
      : null;
  });
  readonly almacenes = useAlmacenesExistencias();
  readonly existencias = useExistencias(this.filtro);
  readonly alcanceNombre = computed(() =>
    this.almacenId() === 'todos'
      ? 'Todos los almacenes activos'
      : (this.almacenes.data()?.find((almacen) => almacen.id === this.almacenId())?.nombre ??
        'Almacén seleccionado'),
  );
  readonly totalPages = computed(() => {
    const response = this.existencias.data();
    return response ? Math.ceil(response.totalItems / response.limit) : 0;
  });
  readonly soles = soles;
  readonly promedio = promedio;
  readonly decimalCompacto = decimalCompacto;

  constructor() {
    effect(() => this.searchDraft.set(this.q()));
  }

  unidadElegida(fila: ExistenciaItem): string | null {
    return this.unidadesElegidas()[`${fila.variante.id}:${fila.almacen.id}`] ?? null;
  }

  elegirUnidad(fila: ExistenciaItem, id: string | null): void {
    const key = `${fila.variante.id}:${fila.almacen.id}`;
    if (id && !fila.unidadesSecundarias.some((unidad) => unidad.id === id)) return;
    this.unidadesElegidas.update((actual) => {
      const siguiente = { ...actual };
      if (id) siguiente[key] = id;
      else delete siguiente[key];
      return siguiente;
    });
  }

  elegirAlmacen(id: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { almacenId: id || null }, queryParamsHandling: 'merge' });
    this.page.set(1);
  }

  buscar(event: Event): void {
    event.preventDefault();
    void this.router.navigate([], { relativeTo: this.route, queryParams: { q: this.searchDraft().trim() || null }, queryParamsHandling: 'merge' });
    this.page.set(1);
  }

  elegirDisponibilidad(value: string): void {
    if (value !== 'todas' && value !== 'con_stock' && value !== 'sin_stock') return;
    this.disponibilidad.set(value);
    this.page.set(1);
  }

  limpiarFiltros(): void {
    this.searchDraft.set('');
    void this.router.navigate([], { relativeTo: this.route, queryParams: { q: null }, queryParamsHandling: 'merge' });
    this.disponibilidad.set('todas');
    this.page.set(1);
  }

  cambiarTamano(size: number): void {
    this.pageSize.set(size);
    this.page.set(1);
  }
}
