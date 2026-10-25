import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, debounced, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { FiltroHistorialMovimientos, TipoMovimientoHistorial } from '../../../api/interfaces/inventario/historial-movimiento.interface';
import { useHistorialListado } from '../../actions/use-historial-action';
import { HistorialFiltros } from './components/historial-filtros';
import type { FiltroTipoHistorial } from './historial-demo.model';

function fechaValida(valor: string | null): string {
  if (!valor || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return '';
  const [year, month, day] = valor.split('-').map(Number);
  const fecha = new Date(Date.UTC(year, month - 1, day));
  return fecha.getUTCFullYear() === year && fecha.getUTCMonth() + 1 === month && fecha.getUTCDate() === day
    ? valor : '';
}

function enteroPositivo(valor: string | null, defecto: number): number {
  if (!valor || !/^[1-9]\d*$/.test(valor)) return defecto;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) ? numero : defecto;
}

function tipoValido(valor: string | null): FiltroTipoHistorial {
  return valor === 'ingreso' || valor === 'salida' || valor === 'traslado' || valor === 'ajuste'
    ? valor : 'todos';
}

@Component({
  selector: 'app-historial-page',
  imports: [DatePipe, HistorialFiltros, RouterLink],
  templateUrl: './historial-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HistorialPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly inicial = this.route.snapshot.queryParamMap;

  readonly busqueda = signal(this.busquedaValida(this.inicial.get('q')));
  readonly busquedaDiferida = debounced(this.busqueda, 300);
  readonly q = signal(this.busqueda());
  readonly tipo = signal<FiltroTipoHistorial>(tipoValido(this.inicial.get('tipo')));
  readonly desde = signal(fechaValida(this.inicial.get('desde')));
  readonly hasta = signal(fechaValida(this.inicial.get('hasta')));
  readonly page = signal(enteroPositivo(this.inicial.get('page'), 1));
  readonly limit = signal([5, 10, 20].includes(Number(this.inicial.get('limit')))
    ? Number(this.inicial.get('limit')) : 20);
  readonly rangoInvertido = computed(() => !!this.desde() && !!this.hasta() && this.desde() > this.hasta());
  readonly filtro = computed<FiltroHistorialMovimientos | null>(() => {
    if (this.rangoInvertido()) return null;
    const q = this.q();
    const tipo = this.tipo();
    const desde = this.desde();
    const hasta = this.hasta();
    return {
      ...(q ? { q } : {}),
      ...(tipo !== 'todos' ? { tipo: tipo as TipoMovimientoHistorial } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      page: this.page(), limit: this.limit(),
    };
  });
  readonly historial = useHistorialListado(this.filtro);
  readonly paramsDetalle = computed(() => this.parametros());

  constructor() {
    // El primer GET ya usa los parámetros normalizados; corregir la URL sin añadir historial.
    queueMicrotask(() => this.sincronizarUrl());
    this.route.queryParamMap.subscribe((params) => {
      const q = this.busquedaValida(params.get('q'));
      const tipo = tipoValido(params.get('tipo'));
      const desde = fechaValida(params.get('desde'));
      const hasta = fechaValida(params.get('hasta'));
      const page = enteroPositivo(params.get('page'), 1);
      const limit = [5, 10, 20].includes(Number(params.get('limit')))
        ? Number(params.get('limit')) : 20;
      // No reemplazar lo que está tecleando la persona durante nuestra propia navegación.
      if (this.q() !== q) { this.q.set(q); this.busqueda.set(q); }
      this.tipo.set(tipo);
      this.desde.set(desde);
      this.hasta.set(hasta);
      this.page.set(page);
      this.limit.set(limit);
    });
    effect(() => {
      const texto = this.busquedaDiferida.value();
      if (texto === undefined || texto !== this.busqueda()) return;
      const q = this.busquedaValida(texto);
      if (q === this.q()) return;
      this.q.set(q);
      this.page.set(1);
      this.sincronizarUrl();
    });
  }

  private busquedaValida(valor: string | null): string {
    const texto = valor?.trim() ?? '';
    return texto.length >= 2 && texto.length <= 200 ? texto : '';
  }

  private parametros() {
    return {
      q: this.q() || null,
      tipo: this.tipo() === 'todos' ? null : this.tipo(),
      desde: this.desde() || null,
      hasta: this.hasta() || null,
      page: this.page() === 1 ? null : this.page(),
      limit: this.limit() === 20 ? null : this.limit(),
    };
  }

  private sincronizarUrl(): void {
    const normalizados = this.parametros();
    const actuales = this.route.snapshot.queryParamMap;
    if (Object.entries(normalizados).every(([key, valor]) => actuales.get(key) === (valor === null ? null : String(valor)))
      && actuales.keys.every((key) => key in normalizados)) return;
    void this.router.navigate([], {
      relativeTo: this.route, queryParams: normalizados, replaceUrl: true,
    });
  }

  cambiarBusqueda(valor: string): void { this.busqueda.set(valor); }
  cambiarTipo(valor: FiltroTipoHistorial): void {
    this.tipo.set(valor); this.page.set(1); this.sincronizarUrl();
  }
  cambiarDesde(valor: string): void {
    this.desde.set(fechaValida(valor)); this.page.set(1); this.sincronizarUrl();
  }
  cambiarHasta(valor: string): void {
    this.hasta.set(fechaValida(valor)); this.page.set(1); this.sincronizarUrl();
  }
  cambiarPage(valor: number): void {
    if (!Number.isSafeInteger(valor) || valor < 1) return;
    this.page.set(valor); this.sincronizarUrl();
  }
  cambiarLimit(valor: number): void {
    if (![5, 10, 20].includes(valor)) return;
    this.limit.set(valor); this.page.set(1); this.sincronizarUrl();
  }
  limpiarFiltros(): void {
    this.busqueda.set(''); this.q.set(''); this.tipo.set('todos');
    this.desde.set(''); this.hasta.set(''); this.page.set(1);
    this.sincronizarUrl();
  }
}
