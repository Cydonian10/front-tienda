import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PERMISSION_CODES } from '../../../api/interfaces/access-control/permision.interface';
import { AuthorizationService } from '../../../auth/services/authorization.service';
import { usePermissions } from '../../../auth/services/use-permissions';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { useProveedoresListado } from '../../actions/use-proveedores-action';
import { CrearProveedorDialog } from './components/crear-proveedor-dialog';

@Component({
  selector: 'app-proveedores-page',
  imports: [EmptyState, Pagination, RouterLink, CrearProveedorDialog],
  templateUrl: './proveedores-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block min-w-0' },
})
export default class ProveedoresPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authorization = inject(AuthorizationService);
  readonly permissions = usePermissions('INVENTARIO', { create: PERMISSION_CODES.PROVEEDORES_CREATE });
  readonly showCreate = signal(false);
  private readonly params = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly filters = computed(() => {
    const params = this.params();
    const page = Number(params.get('page'));
    const limit = Number(params.get('limit'));
    return {
      nombre: params.get('nombre') ?? '',
      documento: params.get('documento') ?? '',
      page: Number.isSafeInteger(page) && page > 0 ? page : 1,
      limit: [10, 20, 50].includes(limit) ? limit : 20,
    };
  });
  readonly nombreDraft = signal(this.route.snapshot.queryParamMap.get('nombre') ?? '');
  readonly documentoDraft = signal(this.route.snapshot.queryParamMap.get('documento') ?? '');
  readonly query = useProveedoresListado(
    () => this.filters().page,
    () => this.filters().limit,
    () => this.filters().nombre,
    () => this.filters().documento,
  );

  constructor() {
    effect(() => {
      const { nombre, documento } = this.filters();
      this.nombreDraft.set(nombre);
      this.documentoDraft.set(documento);
    });
  }

  search(event: Event): void {
    event.preventDefault();
    void this.navigate({
      nombre: this.nombreDraft().trim().slice(0, 200),
      documento: this.documentoDraft().trim().slice(0, 100),
      page: 1,
    });
  }

  clearSearch(): void {
    this.nombreDraft.set('');
    this.documentoDraft.set('');
    void this.navigate({ nombre: '', documento: '', page: 1 });
  }

  changePage(page: number): void {
    void this.navigate({ page });
  }

  changePageSize(limit: number): void {
    void this.navigate({ limit, page: 1 });
  }

  openCreate(): void {
    if (!this.authorization.hasPermission('INVENTARIO', PERMISSION_CODES.PROVEEDORES_CREATE)) return;
    this.showCreate.set(true);
  }

  private navigate(change: Partial<ReturnType<typeof this.filters>>): Promise<boolean> {
    const next = { ...this.filters(), ...change };
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        nombre: next.nombre || null,
        documento: next.documento || null,
        page: next.page === 1 ? null : next.page,
        limit: next.limit === 20 ? null : next.limit,
      },
    });
  }
}
