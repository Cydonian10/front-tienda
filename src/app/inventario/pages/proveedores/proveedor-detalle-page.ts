import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import type { FiltroComprasProveedor } from '../../../api/interfaces/inventario/proveedor.interface';
import { usePermissions } from '../../../auth/services/use-permissions';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../shared/components/icon/icon';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { esProveedorIdValido, useProveedorCompras } from '../../actions/use-proveedores-action';
import { documentoCompra, formatTotalPEN } from '../compras/compra-form.model';

function fechaValida(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

@Component({
  selector: 'app-proveedor-detalle-page',
  imports: [RouterLink, EmptyState, Pagination, Icon],
  templateUrl: './proveedor-detalle-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export default class ProveedorDetallePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly routeParams = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  readonly access = usePermissions('INVENTARIO', {
    proveedores: PERMISSION_CODES.PROVEEDORES_READ,
    compras: PERMISSION_CODES.COMPRAS_READ,
  });
  readonly id = computed(() => this.routeParams().get('id') ?? '');
  readonly fechaDesde = signal(this.route.snapshot.queryParamMap.get('desde') ?? '');
  readonly fechaHasta = signal(this.route.snapshot.queryParamMap.get('hasta') ?? '');
  readonly fechas = computed(() => ({
    desde: this.params().get('desde') ?? '',
    hasta: this.params().get('hasta') ?? '',
  }));
  readonly fechaError = computed(() => {
    const { desde, hasta } = this.fechas();
    if ((desde && !fechaValida(desde)) || (hasta && !fechaValida(hasta))) {
      return 'Ingresa fechas válidas con el formato YYYY-MM-DD.';
    }
    if (desde && hasta && desde > hasta) return 'La fecha desde no puede ser posterior a hasta.';
    return '';
  });
  readonly page = computed(() => {
    const value = Number(this.params().get('page'));
    return Number.isSafeInteger(value) && value > 0 ? value : 1;
  });
  readonly limit = computed(() => {
    const value = Number(this.params().get('limit'));
    return [10, 20, 50].includes(value) ? value : 20;
  });
  readonly filtro = computed<FiltroComprasProveedor | null>(() => {
    if (this.fechaError()) return null;
    const { desde, hasta } = this.fechas();
    return {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      page: this.page(),
      limit: this.limit(),
    };
  });
  readonly informe = useProveedorCompras(this.id, this.filtro);
  readonly noEncontrado = computed(() => {
    const error = this.informe.error();
    return !esProveedorIdValido(this.id()) ||
      (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 404));
  });
  readonly filtrosRegreso = computed(() => {
    const params = this.params();
    return {
      nombre: params.get('listaNombre') || null,
      documento: params.get('listaDocumento') || null,
      page: params.get('listaPage') && params.get('listaPage') !== '1' ? params.get('listaPage') : null,
      limit: params.get('listaLimit') && params.get('listaLimit') !== '20' ? params.get('listaLimit') : null,
    };
  });
  readonly documento = documentoCompra;
  readonly monto = (value: string | null) => value === null ? 'No disponible' : formatTotalPEN(value);

  constructor() {
    effect(() => {
      const { desde, hasta } = this.fechas();
      this.fechaDesde.set(desde);
      this.fechaHasta.set(hasta);
    });
  }

  applyDates(event: Event): void {
    event.preventDefault();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: {
        desde: this.fechaDesde() || null,
        hasta: this.fechaHasta() || null,
        page: null,
      },
    });
  }

  clearDates(): void {
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: { desde: null, hasta: null, page: null },
    });
  }

  changePage(page: number): void {
    void this.navigatePage(page, this.limit());
  }

  changePageSize(limit: number): void {
    void this.navigatePage(1, limit);
  }

  private navigatePage(page: number, limit: number): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParamsHandling: 'merge',
      queryParams: { page: page === 1 ? null : page, limit: limit === 20 ? null : limit },
    });
  }
}
