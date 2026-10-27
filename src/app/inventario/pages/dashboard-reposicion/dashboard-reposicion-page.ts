import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ExistenciaApi } from '../../../api/inventario/existencia-api';
import { MovimientoApi } from '../../../api/inventario/movimiento-api';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { PeriodoActividadInventario } from '../../../api/interfaces/inventario/resumen-reposicion.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { existenciasAlmacenesQueryKey } from '../../actions/use-existencias-action';
import { movimientosAlmacenesQueryKey } from '../../actions/use-movimientos-action';
import { useResumenCompras, useResumenReposicion, useResumenSalidas } from '../../actions/use-dashboard-reposicion-action';

function fechaLima(offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === 'year')!.value);
  const month = Number(parts.find((part) => part.type === 'month')!.value);
  const day = Number(parts.find((part) => part.type === 'day')!.value);
  return new Date(Date.UTC(year, month - 1, day + offsetDays)).toISOString().slice(0, 10);
}

export function rangoValido(desde: string, hasta: string): boolean {
  const esFecha = (fecha: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
    const parsed = new Date(`${fecha}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === fecha;
  };
  return esFecha(desde) && esFecha(hasta) && desde <= hasta;
}

export interface DiaActividad {
  fecha: string;
  compras: number | null;
  salidas: number | null;
}

/** Une las dos series por fecha y rellena días sin operaciones sin convertir fallos en ceros. */
export function diasActividad(
  periodo: PeriodoActividadInventario,
  compras: { fecha: string; cantidad: number }[] | null,
  salidas: { fecha: string; cantidad: number }[] | null,
): DiaActividad[] {
  const entradas = compras === null ? null : new Map(compras.map((item) => [item.fecha, item.cantidad]));
  const salidasPorDia = salidas === null ? null : new Map(salidas.map((item) => [item.fecha, item.cantidad]));
  const result: DiaActividad[] = [];
  const end = Date.parse(`${periodo.hasta}T00:00:00Z`);
  for (let date = Date.parse(`${periodo.desde}T00:00:00Z`); date <= end; date += 86_400_000) {
    const fecha = new Date(date).toISOString().slice(0, 10);
    result.push({ fecha, compras: entradas?.get(fecha) ?? (entradas ? 0 : null), salidas: salidasPorDia?.get(fecha) ?? (salidasPorDia ? 0 : null) });
  }
  return result;
}

@Component({
  selector: 'app-dashboard-reposicion-page',
  imports: [RouterLink],
  templateUrl: './dashboard-reposicion-page.html',
  host: { class: 'block min-w-0' },
})
export default class DashboardReposicionPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly existenciasApi = inject(ExistenciaApi);
  private readonly movimientosApi = inject(MovimientoApi);
  readonly access = usePermissions('INVENTARIO', {
    existencias: PERMISSION_CODES.EXISTENCIAS_READ,
    compras: PERMISSION_CODES.COMPRAS_READ,
    movimientos: PERMISSION_CODES.MOVIMIENTOS_READ,
  });
  readonly params = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly defaultDesde = fechaLima(-29);
  readonly defaultHasta = fechaLima();
  readonly desde = computed(() => this.params().get('desde') ?? this.defaultDesde);
  readonly hasta = computed(() => this.params().get('hasta') ?? this.defaultHasta);
  readonly fechaError = computed(() => rangoValido(this.desde(), this.hasta()) ? '' : 'Ingresa un rango de fechas válido, con «Desde» anterior o igual a «Hasta».');
  readonly periodo = computed<PeriodoActividadInventario | null>(() =>
    this.fechaError() ? null : { desde: this.desde(), hasta: this.hasta() },
  );
  readonly puedeElegirAlmacen = computed(() => this.access.existencias() || this.access.movimientos());

  // Los almacenes se solicitan solo a un endpoint autorizado; ambos listados
  // conservan el orden de creación ofrecido por SPEC 16.
  readonly almacenesExistencias = injectQuery(() => ({
    queryKey: existenciasAlmacenesQueryKey,
    queryFn: () => this.existenciasApi.listarAlmacenes(),
    enabled: this.access.existencias(), retry: false,
  }));
  readonly almacenesMovimientos = injectQuery(() => ({
    queryKey: movimientosAlmacenesQueryKey,
    queryFn: () => this.movimientosApi.listarAlmacenes(),
    enabled: !this.access.existencias() && this.access.movimientos(), retry: false,
  }));
  readonly almacenes = computed(() => this.access.existencias()
    ? this.almacenesExistencias.data()
    : this.access.movimientos() ? this.almacenesMovimientos.data() : undefined);
  readonly almacenesError = computed(() => this.access.existencias()
    ? this.almacenesExistencias.isError()
    : this.access.movimientos() && this.almacenesMovimientos.isError());
  readonly almacenesPendientes = computed(() => this.puedeElegirAlmacen() && (
    this.access.existencias() ? this.almacenesExistencias.isPending() : this.almacenesMovimientos.isPending()
  ));
  readonly almacenId = computed(() => {
    if (!this.puedeElegirAlmacen()) return null;
    const list = this.almacenes();
    if (!list?.length) return null;
    const requested = this.params().get('almacenId');
    return list.some((item) => item.id === requested) ? requested : list[0].id;
  });
  readonly almacenNombre = computed(() => this.almacenes()?.find((item) => item.id === this.almacenId())?.nombre ?? 'Almacén');
  readonly stock = useResumenReposicion(this.almacenId);
  readonly compras = useResumenCompras(this.periodo);
  readonly salidas = useResumenSalidas(this.almacenId, this.periodo);
  readonly serieDiaria = computed(() => {
    const rango = this.periodo();
    if (!rango) return [];
    return diasActividad(rango,
      this.access.compras() && this.compras.isSuccess() ? this.compras.data()!.porDia : null,
      this.access.movimientos() && this.almacenId() && this.salidas.isSuccess() ? this.salidas.data()!.porDia : null,
    );
  });
  readonly maximoDiario = computed(() => Math.max(1, ...this.serieDiaria().flatMap((dia) => [dia.compras ?? 0, dia.salidas ?? 0])));
  readonly mostrarActividad = computed(() => (this.access.compras() && this.compras.isSuccess()) ||
    (this.access.movimientos() && !!this.almacenId() && this.salidas.isSuccess()));

  constructor() {
    effect(() => {
      const params = this.params();
      const id = this.almacenId();
      const updates: Record<string, string | null> = {};
      if (!params.has('desde')) updates['desde'] = this.defaultDesde;
      if (!params.has('hasta')) updates['hasta'] = this.defaultHasta;
      if (id && params.get('almacenId') !== id) updates['almacenId'] = id;
      if (!this.puedeElegirAlmacen() && params.has('almacenId')) updates['almacenId'] = null;
      if (Object.keys(updates).length) void this.router.navigate([], {
        relativeTo: this.route, queryParams: updates, queryParamsHandling: 'merge', replaceUrl: true,
      });
    });
  }

  cambiarAlmacen(value: string): void {
    if (!this.puedeElegirAlmacen() || !this.almacenes()?.some((item) => item.id === value)) return;
    void this.router.navigate([], { relativeTo: this.route, queryParams: { almacenId: value }, queryParamsHandling: 'merge' });
  }

  cambiarFecha(campo: 'desde' | 'hasta', value: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { [campo]: value }, queryParamsHandling: 'merge' });
  }

  reintentarAlmacenes(): void {
    if (this.access.existencias()) void this.almacenesExistencias.refetch();
    else if (this.access.movimientos()) void this.almacenesMovimientos.refetch();
  }
}
